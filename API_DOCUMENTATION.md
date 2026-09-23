# Mboka Wallet Developer API Documentation

Welcome to the **Mboka Wallet Merchant & Developer API** documentation. The Mboka API enables e-commerce websites, mobile apps, point-of-sale systems, and custom software to collect customer payments via M-Pesa in Kenyan Shillings (KES). 

Every payment request processed through this API is strictly linked to a merchant's unique **Mboka Wallet ID** (e.g. `MBK-904281`), guaranteeing that collected revenue immediately settles into the correct wallet balance in real time.

---

## Table of Contents

1. [Overview & Core Architecture](#overview--core-architecture)
2. [Base URL & Environments](#base-url--environments)
3. [Authentication & API Keys](#authentication--api-keys)
4. [Settlement Engine (Wallet ID Binding)](#settlement-engine-wallet-id-binding)
5. [Endpoints Reference](#endpoints-reference)
   - [1. Initialize Payment Charge](#1-initialize-payment-charge)
   - [2. Get Charge Status](#2-get-charge-status)
   - [3. Complete / Settle Charge (Sandbox)](#3-complete--settle-charge-sandbox)
   - [4. Fetch Settlement History](#4-fetch-settlement-history)
   - [5. Retrieve API Keys](#5-retrieve-api-keys)
   - [6. Rotate API Keys](#6-rotate-api-keys)
   - [7. Configure Webhook URL](#7-configure-webhook-url)
6. [Webhooks & Real-Time Callbacks](#webhooks--real-time-callbacks)
7. [Automated B2C Settlement (Auto-Disbursement)](#automated-b2c-settlement-auto-disbursement)
8. [Code Examples](#code-examples)
   - [cURL](#curl)
   - [Node.js / TypeScript](#nodejs--typescript)
   - [Python](#python)
   - [PHP](#php)
9. [Error Codes & Troubleshooting](#error-codes--troubleshooting)

---

## Overview & Core Architecture

Mboka Wallet acts as a modern non-custodial financial layer for African creators, merchants, and digital workers:

- **Instant Settlement**: Customer funds are credited to your active Mboka ledger the moment the M-Pesa transaction is authorized.
- **Zero Reconciliation Overhead**: Each charge payload carries your `walletId` and reference code.
- **Automated Payouts**: Configure the Auto-B2C rule in your dashboard so that accumulated balances above your chosen threshold automatically disburse to your designated mobile phone number.

---

## Base URL & Environments

| Environment | Base URL |
| :--- | :--- |
| **Production** | `https://mboka.app/api/v1` |
| **Local / Dev Server** | `http://localhost:3000/api/v1` |

All requests must use `HTTPS` and send/receive payloads in `application/json`.

---

## Authentication & API Keys

Authentication to the Mboka API is performed using API keys linked to your Wallet ID:

- **Public Key** (`mbk_live_pk_...`): Used on client-side applications, checkout buttons, and mobile frontends.
- **Secret Key** (`mbk_live_sk_...`): Used for server-to-server operations (`POST /charges/initialize`). **Never expose your secret key in frontend browser code or public repositories.**

### Supplying Credentials

Include your Secret API Key in the `Authorization` header as a Bearer token:

```http
Authorization: Bearer mbk_live_sk_9a8b7c6d5e4f3a2b1c0d...
```

You can also pass your Wallet ID explicitly via custom headers or the JSON body:

```http
x-wallet-id: MBK-904281
```

---

## Settlement Engine (Wallet ID Binding)

To ensure funds settle into the correct account, every charge resolution inspects:
1. The **Wallet ID** linked to the Secret API Key used in `Authorization: Bearer <secretKey>`.
2. The `x-wallet-id` header if provided.
3. The `walletId` property in the JSON request body.

If neither is provided, the API returns `401 Unauthorized` with a helpful resolution message.

---

## Endpoints Reference

### 1. Initialize Payment Charge

Dispatches an M-Pesa STK push prompt to the customer's phone.

- **Method**: `POST`
- **Endpoint**: `/charges/initialize`
- **Headers**:
  ```http
  Authorization: Bearer <YOUR_SECRET_KEY>
  Content-Type: application/json
  ```

#### Request Body Parameters

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `walletId` | String | Conditional | Your Mboka Wallet ID (e.g., `MBK-904281`). Required if not inferred from API key. |
| `amount` | Number | Yes | Amount in KES (minimum: `1.00`). |
| `phone` | String | Yes | Customer M-Pesa number (e.g. `0712345678` or `254712345678`). |
| `reference` | String | No | Your unique internal order/invoice reference (e.g. `ORD-89214`). |
| `description` | String | No | Brief memo shown to the customer (e.g. `E-Commerce Checkout`). |
| `customerEmail` | String | No | Customer's email for automated digital receipts. |
| `metadata` | Object | No | Key-value pairs for custom developer data (e.g. `{"userId": 42}`). |

#### Request Example

```json
{
  "walletId": "MBK-904281",
  "amount": 750,
  "phone": "254712345678",
  "reference": "ORD-2026-9912",
  "description": "Premium Subscription Tier",
  "customerEmail": "jane@example.com",
  "metadata": {
    "plan": "pro_monthly",
    "referralSource": "google_ads"
  }
}
```

#### Response Example (`201 Created`)

```json
{
  "success": true,
  "status": "pending",
  "chargeId": "chg_94ad81b5c421",
  "reference": "ORD-2026-9912",
  "amount": 750,
  "currency": "KES",
  "settleToWalletId": "MBK-904281",
  "message": "Payment request initialized for KSh 750.00. Funds will automatically settle into Mboka Wallet (MBK-904281) upon customer authorization.",
  "checkoutUrl": "https://mboka.app/pay/chg_94ad81b5c421",
  "charge": {
    "id": "chg_94ad81b5c421",
    "walletId": "MBK-904281",
    "amount": 750,
    "phone": "254712345678",
    "reference": "ORD-2026-9912",
    "description": "Premium Subscription Tier",
    "status": "pending",
    "currency": "KES",
    "createdAt": "2026-09-23T02:14:00.000Z",
    "customerEmail": "jane@example.com",
    "metadata": {
      "plan": "pro_monthly",
      "referralSource": "google_ads"
    }
  }
}
```

---

### 2. Get Charge Status

Retrieves the current status of an initiated charge. Useful for client-side polling while awaiting customer handset authorization.

- **Method**: `GET`
- **Endpoint**: `/charges/:chargeId`

#### Response Example (`200 OK`)

```json
{
  "success": true,
  "data": {
    "id": "chg_94ad81b5c421",
    "walletId": "MBK-904281",
    "amount": 750,
    "phone": "254712345678",
    "reference": "ORD-2026-9912",
    "description": "Premium Subscription Tier",
    "status": "completed",
    "currency": "KES",
    "createdAt": "2026-09-23T02:14:00.000Z",
    "settledAt": "2026-09-23T02:14:18.000Z",
    "mpesaReceiptNumber": "MBK8492018"
  }
}
```

---

### 3. Complete / Settle Charge (Sandbox)

Simulates the customer entering their M-Pesa PIN successfully in testing environments. Immediately marks the transaction as `completed`, generates an M-Pesa receipt code, and dispatches the webhook event to your server.

- **Method**: `POST`
- **Endpoint**: `/charges/:chargeId/complete`

#### Response Example (`200 OK`)

```json
{
  "success": true,
  "message": "Payment of KSh 750.00 successfully settled into Mboka Wallet (MBK-904281). Receipt: MBK8492018",
  "data": {
    "id": "chg_94ad81b5c421",
    "walletId": "MBK-904281",
    "amount": 750,
    "phone": "254712345678",
    "reference": "ORD-2026-9912",
    "status": "completed",
    "settledAt": "2026-09-23T02:14:18.000Z",
    "mpesaReceiptNumber": "MBK8492018"
  }
}
```

---

### 4. Fetch Settlement History

Retrieves all payment collections that settled into a specific Wallet ID.

- **Method**: `GET`
- **Endpoint**: `/charges/history/:walletId`

#### Response Example (`200 OK`)

```json
{
  "success": true,
  "total": 1,
  "data": [
    {
      "id": "chg_94ad81b5c421",
      "walletId": "MBK-904281",
      "amount": 750,
      "phone": "254712345678",
      "reference": "ORD-2026-9912",
      "status": "completed",
      "createdAt": "2026-09-23T02:14:00.000Z",
      "settledAt": "2026-09-23T02:14:18.000Z",
      "mpesaReceiptNumber": "MBK8492018"
    }
  ]
}
```

---

### 5. Retrieve API Keys

Fetches the current public and secret keys linked to a given Wallet ID.

- **Method**: `GET`
- **Endpoint**: `/keys/:walletId`

#### Response Example (`200 OK`)

```json
{
  "success": true,
  "data": {
    "walletId": "MBK-904281",
    "publicKey": "mbk_live_pk_mbk904281_f10a82b947c1",
    "secretKey": "mbk_live_sk_89c8a14b035174091dca4",
    "webhookUrl": "https://example.com/api/webhooks/mboka",
    "merchantName": "Mboka Merchant",
    "createdAt": "2026-09-23T02:00:00.000Z"
  }
}
```

---

### 6. Rotate API Keys

Generates a fresh Secret API Key and updates credentials for the Wallet ID.

- **Method**: `POST`
- **Endpoint**: `/keys/generate`
- **Request Body**:
  ```json
  {
    "walletId": "MBK-904281",
    "merchantName": "Mboka Superstore",
    "webhookUrl": "https://example.com/api/webhooks/mboka"
  }
  ```

---

### 7. Configure Webhook URL

Registers an HTTP POST endpoint on your server to receive real-time payment notifications.

- **Method**: `POST`
- **Endpoint**: `/keys/webhook`
- **Request Body**:
  ```json
  {
    "walletId": "MBK-904281",
    "webhookUrl": "https://yourdomain.com/webhooks/mboka"
  }
  ```

---

## Webhooks & Real-Time Callbacks

When a customer enters their M-Pesa PIN and authorization succeeds, Mboka dispatches an HTTP `POST` request to your registered Webhook URL.

### Webhook Payload Example

```json
{
  "event": "payment.settled",
  "data": {
    "id": "chg_94ad81b5c421",
    "walletId": "MBK-904281",
    "amount": 750.00,
    "currency": "KES",
    "phone": "254712345678",
    "reference": "ORD-2026-9912",
    "description": "Premium Subscription Tier",
    "status": "completed",
    "createdAt": "2026-09-23T02:14:00.000Z",
    "settledAt": "2026-09-23T02:14:18.000Z",
    "mpesaReceiptNumber": "MBK8492018",
    "customerEmail": "jane@example.com",
    "metadata": {
      "plan": "pro_monthly"
    }
  }
}
```

### Expected Response

Your endpoint should return an HTTP `200 OK` status code within 5 seconds:

```json
{ "received": true }
```

---

## Automated B2C Settlement (Auto-Disbursement)

If you enable **Automated B2C Payout** on your Mboka Wallet dashboard:
1. Payments collected through the API settle directly into your wallet.
2. The moment your balance meets or exceeds your configured trigger threshold (e.g. `KSh 500`), the automated B2C engine sweeps and disburses the **full accumulated balance (amount set and above)** directly to your designated M-Pesa mobile number.
3. This eliminates manual withdrawal clicks and creates a fully hands-free settlement pipeline.

---

## Code Examples

### cURL

```bash
curl -X POST https://mboka.app/api/v1/charges/initialize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mbk_live_sk_YOUR_SECRET_KEY" \
  -d '{
    "walletId": "MBK-904281",
    "amount": 500,
    "phone": "254712345678",
    "reference": "ORD-9042",
    "description": "Store Purchase",
    "customerEmail": "customer@example.com"
  }'
```

---

### Node.js / TypeScript

```typescript
import axios from 'axios';

interface InitializeChargeResponse {
  success: boolean;
  chargeId: string;
  reference: string;
  amount: number;
  settleToWalletId: string;
  status: string;
}

async function collectCustomerPayment() {
  try {
    const response = await axios.post<InitializeChargeResponse>(
      'https://mboka.app/api/v1/charges/initialize',
      {
        walletId: 'MBK-904281', // Your settlement Wallet ID
        amount: 1200,
        phone: '254712345678',
        reference: 'INV-48201',
        description: 'E-commerce Checkout'
      },
      {
        headers: {
          'Authorization': 'Bearer mbk_live_sk_YOUR_SECRET_KEY',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Payment initiated successfully:', response.data.chargeId);
    console.log('Settling to Wallet:', response.data.settleToWalletId);
  } catch (error: any) {
    console.error('Payment initiation error:', error.response?.data || error.message);
  }
}

collectCustomerPayment();
```

---

### Python

```python
import requests

url = "https://mboka.app/api/v1/charges/initialize"

headers = {
    "Authorization": "Bearer mbk_live_sk_YOUR_SECRET_KEY",
    "Content-Type": "application/json"
}

payload = {
    "walletId": "MBK-904281",
    "amount": 1200,
    "phone": "254712345678",
    "reference": "INV-48201",
    "description": "E-Commerce Checkout"
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()

if data.get("success"):
    print(f"Charge {data['chargeId']} created. Settling into {data['settleToWalletId']}")
else:
    print(f"Error: {data.get('error')}")
```

---

### PHP

```php
<?php
$url = 'https://mboka.app/api/v1/charges/initialize';
$secretKey = 'mbk_live_sk_YOUR_SECRET_KEY';

$payload = json_encode([
    'walletId' => 'MBK-904281',
    'amount' => 1200,
    'phone' => '254712345678',
    'reference' => 'INV-48201',
    'description' => 'Online Order Payment'
]);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $secretKey
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = json_decode($response, true);
echo "Status Code: " . $httpCode . "\n";
print_r($data);
?>
```

---

## Error Codes & Troubleshooting

| HTTP Code | Error Message | Solution |
| :--- | :--- | :--- |
| `400 Bad Request` | `Amount must be a positive number of at least KSh 1.00` | Verify the `amount` field is numeric and &ge; 1.00. |
| `400 Bad Request` | `Customer phone number is required` | Pass a valid Kenyan phone format (`07...`, `01...`, or `254...`). |
| `401 Unauthorized` | `Missing Wallet ID. Provide Authorization: Bearer <secret_key>...` | Pass your valid secret key in the `Authorization` header or specify `walletId` in the body. |
| `404 Not Found` | `Charge not found` | Check that the `chargeId` parameter matches an existing initialized transaction. |
| `500 Server Error` | `Failed to initialize payment charge` | Check server network status or review the error payload for details. |

---

*Documentation Version: 1.2.0 • Last Updated: September 2026 • Mboka Wallet Engineering*
