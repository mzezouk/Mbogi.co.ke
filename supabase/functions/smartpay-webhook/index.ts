// Supabase Edge Function: smartpay-webhook
// Handles webhook callbacks and IPN notifications from SmartPayPesa & M-Pesa
// Standard Deno runtime environment for Supabase Edge Functions

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature, x-webhook-secret',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // 2. Health check & verification
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({
        status: 'active',
        service: 'Mboka SmartPayPesa Supabase Edge Webhook',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        supportedEvents: [
          'c2b.stk_callback',
          'c2b.completed',
          'b2c.completed',
          'b2c.payout',
        ],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Only POST accepted.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
      Deno.env.get('SUPABASE_ANON_KEY') ||
      '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let payload: any = {};
    try {
      payload = await req.json();
    } catch {
      payload = {};
    }

    console.log('Received SmartPay Webhook Event:', JSON.stringify(payload));

    // Normalize incoming payload from either Safaricom Daraja STKCallback or SmartPay JSON
    let checkoutRequestId = '';
    let merchantRequestId = '';
    let resultCode: number | null = null;
    let resultDesc = '';
    let amount: number = 0;
    let mpesaReceipt = '';
    let phoneNumber = '';
    let eventType = 'c2b.stk_callback';

    if (payload?.Body?.stkCallback) {
      const cb = payload.Body.stkCallback;
      merchantRequestId = cb.MerchantRequestID || '';
      checkoutRequestId = cb.CheckoutRequestID || '';
      resultCode = typeof cb.ResultCode === 'number' ? cb.ResultCode : 0;
      resultDesc = cb.ResultDesc || '';

      if (cb.CallbackMetadata?.Item) {
        for (const item of cb.CallbackMetadata.Item) {
          if (item.Name === 'Amount') amount = Number(item.Value) || 0;
          if (item.Name === 'MpesaReceiptNumber') mpesaReceipt = String(item.Value);
          if (item.Name === 'PhoneNumber') phoneNumber = String(item.Value);
        }
      }
    } else {
      // Flat SmartPay format or B2C disbursement callback
      checkoutRequestId =
        payload.checkout_request_id ||
        payload.checkoutRequestId ||
        payload.transaction_id ||
        '';
      merchantRequestId =
        payload.merchant_request_id || payload.merchantRequestId || '';
      mpesaReceipt =
        payload.mpesa_receipt_number ||
        payload.mpesa_receipt ||
        payload.receipt ||
        '';
      amount = Number(payload.amount) || 0;
      phoneNumber =
        payload.phone || payload.phone_number || payload.phoneNumber || '';
      resultCode =
        typeof payload.result_code === 'number'
          ? payload.result_code
          : payload.status === 'completed' ||
            payload.status === 'successful' ||
            payload.success === true
          ? 0
          : 1;
      resultDesc =
        payload.result_desc ||
        payload.message ||
        (resultCode === 0 ? 'Transaction completed successfully' : 'Transaction failed');
      eventType = payload.event || (payload.b2c ? 'b2c.payout' : 'c2b.deposit');
    }

    const isSuccess = resultCode === 0;
    const eventId = `evt_${checkoutRequestId || Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 7)}`;

    // 1. Audit event into mboka_smartpay_events
    try {
      await supabase.from('mboka_smartpay_events').insert({
        id: eventId,
        event_type: eventType,
        checkout_request_id: checkoutRequestId,
        merchant_request_id: merchantRequestId,
        mpesa_receipt: mpesaReceipt,
        amount,
        phone: phoneNumber,
        result_code: resultCode,
        result_desc: resultDesc,
        raw_payload: payload,
        processed: true,
        created_at: new Date().toISOString(),
      });
    } catch (e: any) {
      console.warn('Notice recording event to mboka_smartpay_events:', e?.message);
    }

    // 2. If successful, record in mboka_transactions and reconcile wallet
    if (isSuccess && amount > 0) {
      const txId = `tx_${checkoutRequestId || Date.now()}`;
      const reference =
        mpesaReceipt ||
        `SP-${(checkoutRequestId || '').substring(0, 10).toUpperCase() || Date.now()}`;

      try {
        // Idempotency check: don't double insert if already recorded
        const { data: existing } = await supabase
          .from('mboka_transactions')
          .select('id')
          .eq('reference', reference)
          .maybeSingle();

        if (!existing) {
          await supabase.from('mboka_transactions').insert({
            id: txId,
            reference,
            type: eventType.includes('b2c') ? 'withdrawal' : 'deposit',
            amount,
            fee: 0,
            description: `SmartPay M-Pesa ${
              eventType.includes('b2c') ? 'Payout' : 'Deposit'
            } (${reference})`,
            status: 'completed',
            recipient_or_sender: phoneNumber,
            created_at: new Date().toISOString(),
          });

          console.log(`Reconciled transaction ${reference} in Supabase mboka_transactions.`);
        }
      } catch (err: any) {
        console.warn('Notice inserting mboka_transaction:', err?.message);
      }
    }

    // Return standard Safaricom / SmartPay acknowledgment JSON
    return new Response(
      JSON.stringify({
        ResultCode: 0,
        ResultDesc: 'Accepted',
        success: true,
        event_id: eventId,
        checkout_request_id: checkoutRequestId,
        mpesa_receipt: mpesaReceipt,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error processing SmartPay webhook:', error);
    return new Response(
      JSON.stringify({
        ResultCode: 1,
        ResultDesc: error?.message || 'Error processing webhook',
        success: false,
      }),
      {
        status: 200, // Return 200 so upstream gateway doesn't loop retries on bad JSON
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
