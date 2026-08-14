# Pesapal setup

Ellena uses Pesapal API 3.0. Keep the integration in sandbox mode until the complete payment flow has been tested.

## 1. Add sandbox credentials

Add the credentials supplied by Pesapal to `.env`:

```dotenv
PESAPAL_ENVIRONMENT=sandbox
PESAPAL_CONSUMER_KEY=
PESAPAL_CONSUMER_SECRET=
PESAPAL_CURRENCY=UGX
PESAPAL_CALLBACK_URL="${APP_URL}/payments/pesapal/callback"
PESAPAL_IPN_URL="${APP_URL}/payments/pesapal/ipn"
PESAPAL_CANCELLATION_URL="${APP_URL}/dashboard#orders"
PESAPAL_CA_BUNDLE=C:/laragon/etc/ssl/cacert.pem
PESAPAL_TOKEN_CACHE_SECONDS=240
```

`APP_URL` and both Pesapal endpoints must use the same publicly accessible HTTPS domain. A temporary ngrok URL must be updated whenever the tunnel address changes.

## 2. Register the IPN URL

Clear cached configuration, register the configured IPN URL, and copy the returned ID into `.env`:

```shell
php artisan optimize:clear
php artisan pesapal:register-ipn
```

```dotenv
PESAPAL_IPN_ID=the-returned-uuid
```

Clear configuration again:

```shell
php artisan optimize:clear
```

Pesapal becomes selectable at checkout only when the consumer key, consumer secret, and IPN ID are configured.

## 3. Test the sandbox flow

1. Add a product and complete checkout with a verified customer account.
2. Select Pesapal during review.
3. Complete a sandbox payment on Pesapal's hosted page.
4. Confirm the order returns to Ellena and shows `paid`.
5. Confirm the admin order displays the Pesapal confirmation details.

Ellena verifies callback and IPN notifications by querying Pesapal directly. The callback payload alone never marks an order paid. Amount and currency must match the Ellena order.

## 4. Go live

Replace the credentials with the production merchant credentials, switch the environment, and register the production IPN URL again:

```dotenv
PESAPAL_ENVIRONMENT=production
PESAPAL_CONSUMER_KEY=
PESAPAL_CONSUMER_SECRET=
PESAPAL_IPN_ID=
```

Run `php artisan pesapal:register-ipn`, save the new production IPN ID, and clear configuration. Sandbox credentials and IPN IDs do not carry over to production.

## 5. Production traffic

Checkout prewarms the Pesapal access token during order review. Token refreshes use a cache lock so concurrent customers share one authentication request instead of overwhelming Pesapal.

Use a shared Redis cache across every application server in production:

```dotenv
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
PESAPAL_CACHE_STORE=redis
PESAPAL_TOKEN_CACHE_SECONDS=240
```

Database cache remains supported for local development. Avoid running `php artisan optimize:clear` during active checkout traffic because it removes the warmed token.

Run both the scheduler and queue worker so pending payments are reconciled and paid-order email is delivered:

```shell
php artisan schedule:work
php artisan queue:work --tries=5
```

Production should run `php artisan schedule:run` every minute and supervise queue workers with the hosting platform's process manager. Unpaid Pesapal orders expire after `CHECKOUT_UNPAID_EXPIRY_MINUTES` and release their reserved stock and discount usage exactly once.
