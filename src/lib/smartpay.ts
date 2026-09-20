/**
 * SmartPayPesa Client Integration Service for Mboka Super App
 * Handles:
 * 1. C2B: M-Pesa STK Push (Deposits)
 * 2. B2C: M-Pesa Payouts (Withdrawals & Disbursements)
 * 3. Status Queries & Handset Confirmation Polling
 */

export interface SmartPayGatewayStatus {
  configured: boolean;
  isConfigured?: boolean;
  isSimulated?: boolean;
  apiKeyMasked?: string;
  username?: string;
  c2bReady: boolean;
  b2cReady: boolean;
  provider: string;
  message?: string;
  webhookUrl: string;
  baseUrl: string;
  liveAccount?: {
    account_number: string;
    fullname: string;
    verified: boolean;
  } | null;
  activeKey?: {
    name: string;
    limit_remaining: number;
    plan: string;
  } | null;
}

export interface StkPushResponse {
  success: boolean;
  mode?: 'simulation' | 'live';
  message: string;
  checkout_request_id?: string;
  merchant_request_id?: string;
  customer_message?: string;
  phone?: string;
  amount?: number;
}

export interface StkStatusResponse {
  success: boolean;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'CANCELLED';
  resultCode?: number;
  receipt?: string;
  amount?: number;
  phone?: string;
  message?: string;
  completedAt?: string;
  checkoutRequestId?: string;
}

export interface B2cPayoutResponse {
  success: boolean;
  mode?: 'simulation' | 'live';
  message: string;
  reference: string;
  withdrawal_id?: number;
  conversation_id?: string;
  phone: string;
  amount: number;
  fee: number;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  receipt?: string;
}

export interface B2cStatusResponse {
  success: boolean;
  reference: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
  response_code?: string;
  response_description?: string;
  transaction_id?: string;
}

export const smartpayService = {
  /**
   * Fetch gateway connection and API account status
   */
  async getStatus(): Promise<SmartPayGatewayStatus> {
    try {
      const res = await fetch('/api/smartpay/status');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (e: any) {
      return {
        configured: false,
        c2bReady: true, // fallback to simulation
        b2cReady: true,
        provider: 'SmartPayPesa (Client Fallback)',
        message: e?.message || 'Offline or server error',
        webhookUrl: '/api/smartpay/webhook',
        baseUrl: 'https://api.smartpaypesa.com',
      };
    }
  },

  /**
   * C2B: Send M-Pesa STK Push prompt to user phone
   */
  async sendStkPush(params: {
    phone: string;
    amount: number;
    accountReference?: string;
    description?: string;
  }): Promise<StkPushResponse> {
    try {
      const res = await fetch('/api/smartpay/c2b/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      return data;
    } catch (e: any) {
      return {
        success: false,
        message: e?.message || 'Network error requesting STK Push',
      };
    }
  },

  /**
   * C2B: Check STK Push authorization status
   */
  async checkStkStatus(checkoutRequestId: string): Promise<StkStatusResponse> {
    try {
      const res = await fetch(`/api/smartpay/c2b/status/${encodeURIComponent(checkoutRequestId)}`);
      const data = await res.json();
      return data;
    } catch (e: any) {
      return {
        success: false,
        status: 'PENDING',
        message: e?.message || 'Error checking status',
      };
    }
  },

  /**
   * C2B: Real-time EventSource subscriber for instant webhook notifications
   * Returns a cleanup function to close connection
   */
  subscribeStkEvents(
    checkoutRequestId: string,
    onEvent: (status: StkStatusResponse) => void
  ): () => void {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return () => {};
    }

    try {
      const eventSource = new EventSource(
        `/api/smartpay/c2b/events/${encodeURIComponent(checkoutRequestId)}`
      );

      eventSource.onmessage = (event) => {
        try {
          const data: StkStatusResponse = JSON.parse(event.data);
          onEvent(data);
          if (data.status === 'COMPLETED' || data.status === 'CANCELLED' || data.status === 'FAILED') {
            eventSource.close();
          }
        } catch (e) {
          console.warn('Error parsing SSE event:', e);
        }
      };

      eventSource.onerror = () => {
        // Fall back gracefully to regular polling
        eventSource.close();
      };

      return () => {
        eventSource.close();
      };
    } catch {
      return () => {};
    }
  },

  /**
   * C2B: Explicitly cancel an in-flight STK push request
   */
  async cancelStkPush(params: {
    checkoutRequestId: string;
    phone?: string;
    amount?: number;
    reason?: string;
  }): Promise<StkStatusResponse> {
    try {
      const res = await fetch('/api/smartpay/c2b/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      return data;
    } catch (e: any) {
      return {
        success: false,
        status: 'CANCELLED',
        message: e?.message || 'Deposit cancelled',
      };
    }
  },

  /**
   * C2B: Simulate an approved or cancelled webhook event for testing
   */
  async simulateWebhookEvent(params: {
    checkoutRequestId: string;
    eventType: 'cancel' | 'complete';
    amount?: number;
    phone?: string;
    reason?: string;
  }): Promise<StkStatusResponse> {
    try {
      const res = await fetch('/api/smartpay/c2b/simulate-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      return data;
    } catch (e: any) {
      return {
        success: false,
        status: params.eventType === 'cancel' ? 'CANCELLED' : 'COMPLETED',
        message: e?.message || 'Simulation executed',
      };
    }
  },

  /**
   * Helper: Poll for STK push completion until resolved or timeout
   */
  async pollStkConfirmation(
    checkoutRequestId: string,
    onPoll?: (status: StkStatusResponse) => void,
    maxWaitSeconds = 25
  ): Promise<StkStatusResponse> {
    const startTime = Date.now();
    const intervalMs = 1500;

    while (Date.now() - startTime < maxWaitSeconds * 1000) {
      const status = await this.checkStkStatus(checkoutRequestId);
      if (onPoll) onPoll(status);

      if (status.status === 'COMPLETED' || status.status === 'CANCELLED' || status.status === 'FAILED') {
        return status;
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    return {
      success: false,
      status: 'CANCELLED',
      message: 'M-Pesa authorization prompt timed out on handset.',
    };
  },

  /**
   * B2C: Dispatch instant cash payout / withdrawal to M-Pesa phone
   */
  async sendB2cPayout(params: {
    phone: string;
    amount: number;
  }): Promise<B2cPayoutResponse> {
    try {
      const res = await fetch('/api/smartpay/b2c/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      return data;
    } catch (e: any) {
      return {
        success: false,
        message: e?.message || 'Network error initiating B2C payout',
        reference: `ERR_${Date.now()}`,
        phone: params.phone,
        amount: params.amount,
        fee: 0,
        status: 'FAILED',
      };
    }
  },

  /**
   * B2C: Query status of a dispatched payout
   */
  async checkB2cStatus(ref: string): Promise<B2cStatusResponse> {
    try {
      const res = await fetch(`/api/smartpay/b2c/status/${encodeURIComponent(ref)}`);
      return await res.json();
    } catch (e: any) {
      return {
        success: false,
        reference: ref,
        status: 'PROCESSING',
        response_description: e?.message,
      };
    }
  },
};
