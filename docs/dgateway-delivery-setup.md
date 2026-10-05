# D-Gateway and delivery setup

Ellena now collects payments through D-Gateway. API credentials stay on the Laravel server. Mobile money uses a phone prompt; optional card payments use Stripe Elements through D-Gateway. The browser never supplies the amount charged: the saved order total includes delivery.

## Configuration

```dotenv
DGATEWAY_API_URL=https://dgatewayapi.desispay.com
DGATEWAY_API_KEY=
DGATEWAY_WEBHOOK_URL="${APP_URL}/payments/dgateway/webhook"
DGATEWAY_MOBILE_PROVIDER=iotec
DGATEWAY_CARDS_ENABLED=false
DGATEWAY_CA_BUNDLE=
```

Use a test API key from the D-Gateway merchant dashboard first. `D_GATEWAY_API_KEY` is also accepted if `DGATEWAY_API_KEY` is blank. A `dgw_live_` key moves real money; do not use it with sandbox numbers. Use `iotec` for UGX mobile money or `relworx` for supported regional currencies. Enable cards only after your merchant app is configured for Stripe and its store currency. Ellena does not invent an exchange rate. The existing store currency is snapshotted onto every new order and payment attempt.

Run the new migration, clear Laravel configuration, build frontend assets, and run a queue worker and the Laravel scheduler:

```sh
php artisan migrate --force
php artisan config:clear
npm run build
php artisan queue:work
php artisan schedule:run
```

Production invokes `schedule:run` every minute; `payments:reconcile` runs every two minutes with overlap protection. Use a shared cache for multi-server scheduling. Public HTTPS is required for the webhook. Do not send secret keys to the browser or commit `.env`.

## Delivery

Manage areas at `/admin/delivery`. Each area has a country, district, fee, estimated business days, optional free-delivery threshold, and active toggle. A blank fee requires a quote; an explicit zero is free. No delivery areas or prices are invented or seeded. Pickup is disabled until enabled with collection instructions.

Checkout defaults to requesting a quote. Selecting a priced area updates the preview; Laravel recalculates the fee on submission. Delivery is not included in cart totals until an area is selected. Unpriced orders show a total **before delivery** and cannot initiate or be manually marked paid.

For an unpriced order, open its admin detail page, enter the shipping fee and optional delivery date, then select **Confirm fee and email payment link**. This queues an email with the existing opaque `/pay/{token}` link. The customer reviews the final total before paying. Fees cannot change once a payment attempt exists or the stock reservation is released. Quote-stage orders reserve stock for 48 hours; a confirmed quote renews that window. Payment initiation uses `CHECKOUT_UNPAID_EXPIRY_MINUTES` (default 30). Late verified payments attempt to reserve inventory again; insufficient stock puts fulfillment into payment review.

## Verification and recovery

Webhook payloads are untrusted hints. Ellena calls the authenticated `/v1/webhooks/verify` API and matches the reference, amount, currency, and collection direction when provided. Only a verified completed result marks an order paid. Replayed notifications do not duplicate confirmations or inventory changes. A user can only start/check their own order or an order granted by its opaque payment link.

Every collection has a durable local attempt. Concurrent submissions reuse an active attempt. Collection calls are not automatically retried: a timeout or malformed response can mean the provider accepted the payment. Such attempts become **unknown** and block another collection. In the admin order page, use **Payment needs review** to find the exact request ID in the provider dashboard and link its verified collection reference. Do not substitute another customer's transaction. If the provider has no transaction, resolve this with provider support before changing the attempt; there is deliberately no blind retry/reset button.

The public documentation does not fully specify webhook signature verification or provider-side collection idempotency. Ellena therefore uses authenticated verification and conservative local duplicate prevention rather than inventing either protocol. An API timeout before a reference is returned requires dashboard reconciliation. Failed/pending references are rechecked for seven days; older unresolved transactions require admin review.

## Retired provider and deployment

The Pesapal client, routes, IPN registration, scheduler, UI, and credentials have been removed. Existing orders, their provider identifiers, and payment events are preserved. Do not rename previously executed migrations: the historical migration with Pesapal in its name creates provider-neutral payment columns.

Before production cutover, reconcile outstanding Pesapal transactions in its merchant dashboard and record the results using your operational process. Existing Pesapal orders cannot be charged through D-Gateway or automatically reconciled by the new scheduler. Do not relabel old transactions as D-Gateway payments. Historical configuration/audit documents describe an earlier version; this guide is authoritative for the new integration.

## Acceptance checks

- Test a priced area, unpriced area, disabled area, configured free threshold, and pickup.
- Confirm a quote and inspect the queued email and final total.
- With a test key, try the provider's documented success (`0111777771`), failure (`0111777991`), and pending (`0111777781`) numbers.
- Verify webhook delivery over HTTPS, mismatched amount/currency rejection, retries, replay handling, and expiry/stock recovery.
- Test card authentication with test credentials before enabling cards for customers.
- No live charge or real notification is necessary for the automated tests; they fake HTTP, mail, and queue dispatch.

Official reference: https://dgateway.desispay.com/docs

## Workspace verification (29 September 2026)

- Local migration applied, existing order data retained.
- Full automated suite: 134 of 135 passing. The remaining existing `PasswordConfirmationTest` expects `/login`; the current guest middleware redirects to `/register`. Payment, delivery, and ritual checkout regressions pass.
- TypeScript and ESLint pass for the changed frontend files. PHPStan passes for the payment/delivery PHP files. The full repository PHPStan run still reports unrelated existing findings.
- Checkout quote/review flow checked in the local browser without placing a real order.
- The saved `D_GATEWAY_API_KEY` test key authenticated successfully. A sandbox collection of UGX 1,000 using the documented success number completed and was verified against its reference, amount, and currency. No real funds or local orders changed. The deployed verification endpoint omits totals, so the client retrieves them from the authenticated transaction-details endpoint before accepting payment. `.env.example` contains a blank key placeholder only.

For this Windows workspace, `scripts/check-payments.ps1` runs the installed PHP 8.4 runtime with the required extensions. Set `ELLENA_PHP_BIN` to use a different compatible PHP executable. Modes include `tests`, `alltests`, `static`, and `build`. `access` performs a status-only API check without collecting funds. `sandbox` explicitly creates one simulated UGX 1,000 collection (test keys only); `sandbox-status` rechecks the uniquely identified smoke-test transaction without collecting again. The installed Composer dependencies require PHP 8.4.1 or newer.

## Shop pickup and payment at collection

Enable pickup and enter the shop address under `/admin/delivery`. Selecting Store pickup at checkout offers Pay at shop (default) or online payment. Pickup needs contact details but no delivery address, and shipping is zero. Pay-at-shop orders reserve stock for 48 hours and remain unpaid until staff receive payment. The existing unique order number is displayed as the pickup code, with the shop address and reservation deadline.

Staff enter the full code in `/admin/orders`, confirm the customer and items, then use **Record payment received and collected** after receiving payment. This records an audited payment and marks the order delivered (collected). Repeated clicks are idempotent; expired, cancelled, released, refunded, or review-held reservations cannot be collected through this action. Codes only locate orders inside the authenticated admin area. Pay-at-shop orders cannot initiate D-Gateway collections and do not expose an automation payment-resume token.
