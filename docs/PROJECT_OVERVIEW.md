# Ellena project overview

Ellena is a server-rendered single-page commerce application for the Ellena cosmetics catalogue. It provides a public storefront, guest and account checkout, customer self-service pages, and a protected admin back office.

## Technology

| Area | Implementation |
| --- | --- |
| Backend | PHP 8.3+, Laravel 13 |
| Web UI | React 19, TypeScript, Inertia.js 3 |
| Styling/build | Tailwind CSS 4, Vite 8 |
| Authentication | Laravel Fortify, passkeys, optional Google OAuth (Socialite) |
| Data/runtime defaults | SQLite with database-backed session, cache, and queue; MySQL/Redis supported for production |
| Payments | D-Gateway REST API |
| External automation | n8n signed checkout-session and order-event webhooks |
| Email/marketing | Laravel mail and optional Mailchimp sync |
| Quality tooling | PHPUnit, PHPStan/Larastan, Laravel Pint, ESLint, Prettier, TypeScript |

## Application areas

### Storefront

Public customers can browse the home page, shop catalogue, product pages, curated rituals, search suggestions, cart, checkout, newsletter confirmation, and sitemap. Product pages support approved reviews; submitting a review requires a verified account.

The cart is session-backed. Checkout supports guests and signed-in customers, applies eligible discounts, calculates configured delivery options, reserves stock, and creates a uniquely numbered order.

### Customer accounts

Fortify provides registration, login, password reset, email verification, passkeys, profile, appearance, and security settings. Verified customers can view orders, maintain a wishlist, and post reviews. Google OAuth is optional and explicitly excludes administrator accounts.

### Administration

`/admin` is protected by authentication, the `is_admin` user flag, confirmed two-factor authentication, and activity-audit middleware. Administrators manage:

- products, product images, featured status, and CSV import/export;
- categories, inventory, discounts, banners, and rituals;
- orders, customers, reviews, newsletter subscribers, and store settings.

The legacy-looking `/ellenacosms/govern` route redirects to `/admin`.

## Architecture

```text
Browser
  -> Laravel routes/controllers
       -> Inertia page props -> React/TypeScript pages
       -> services/models -> database, session, cache, queue
       -> integrations: D-Gateway, Google, Mailchimp, n8n
```

Important source locations:

| Location | Responsibility |
| --- | --- |
| `routes/web.php` | Storefront, account, payment, integration, and admin HTTP routes |
| `app/Http/Controllers` | Request orchestration and Inertia responses |
| `app/Services` | Cart, recent-viewing, payment client/service, order payment lifecycle, Mailchimp |
| `app/Jobs` | Queued payment-confirmation email, newsletter sync, and order-event webhook delivery |
| `app/Models` | Eloquent domain models and relationships |
| `resources/js/pages` | React pages for storefront, account, auth, admin, and settings |
| `resources/js/layouts` | Shared storefront, authenticated-app, auth, and settings layouts |
| `database/migrations` | Schema history |
| `database/seeders` | Optional demo catalogue, accounts, and rituals |

## Main data model

```text
User --< Order --< OrderItem >-- Product >-- Category
  |              |
  |              `--< OrderPaymentEvent
  `--< Wishlist >-- Product

Product >--< Ritual
Product --< Review
Order ---- Discount (stored code/amount fields)
StoreSetting, Banner, NewsletterSubscriber, N8nCheckoutSession, AdminActivity
```

Products store pricing, stock, images, catalogue attributes, and publication state. Orders retain item snapshots, customer/delivery details, payment state, expiry/release timestamps, and payment events so historic orders remain meaningful after catalogue changes.

## Payment and fulfillment flow

1. Checkout validates items and available stock, calculates discount and delivery, then creates an order and reserves stock.
2. The customer selects a priced delivery area or receives an admin delivery quote before payment. D-Gateway collection records a durable payment attempt and reference.
3. Webhooks and status checks query D-Gateway directly and compare the reference, amount, and currency before updating the order.
4. The payment lifecycle records events, marks verified payments paid, sends the confirmation email through the queue, and emits the configured n8n order event.
5. The scheduler reconciles D-Gateway payments every two minutes. Expired unpaid orders release stock and discount usage once.

See [D-Gateway and delivery setup](dgateway-delivery-setup.md) for credential configuration and acceptance testing.

## n8n integrations

### Checkout-session API

`POST /integrations/n8n/checkout-sessions` creates a time-limited checkout link from product IDs or names and optional customer details. It requires a timestamp and HMAC signature over `timestamp + "." + raw JSON body`; replayed or stale signatures are rejected. The resulting link populates the browser session cart once and redirects to checkout.

### Order events

Queued order events are sent to the configured HTTPS n8n webhook. The payload includes customer, totals, delivery, payment state, and item snapshots, along with timestamped HMAC headers. Webhook destinations can be limited with `N8N_ORDER_WEBHOOK_HOSTS`.

## Configuration

Use `.env.example` as the source of required variables. Do not commit `.env` or any live key.

The most consequential groups are:

- application and database: `APP_*`, `DB_*`;
- state and background work: `CACHE_STORE`, `SESSION_DRIVER`, `QUEUE_CONNECTION`;
- media: `MEDIA_DISK` and, when using S3, `AWS_*`;
- mail and marketing: `MAIL_*`, `MAILCHIMP_*`;
- OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`;
- payments: `DGATEWAY_*`, `CHECKOUT_UNPAID_EXPIRY_MINUTES`;
- n8n: `N8N_CHECKOUT_SESSION_SECRET`, `N8N_ORDER_WEBHOOK_*`, `N8N_ORDER_WEBHOOK_HOSTS`.

Local defaults use SQLite/database drivers. Production should use a dedicated MySQL application user and shared Redis for cache, session, queue, and scheduler locks when the app runs on more than one server.

## Local development

Prerequisites: PHP 8.3+, Composer, Node.js/npm, and the database driver configured in `.env`.

```bash
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate
npm install
npm run dev
```

In a separate terminal, run Laravel using the project’s normal development command:

```bash
composer dev
```

Demo data is opt-in. Set `SEED_DEMO_DATA=true` plus non-empty `SEED_ADMIN_PASSWORD` and `SEED_CUSTOMER_PASSWORD`, then run:

```bash
php artisan db:seed
```

Never enable demo seeding against production data.

## Background processes

The queue delivers confirmation emails, Mailchimp syncing, and n8n webhooks. The scheduler reconciles pending payments. Run both while exercising payment flows:

```bash
php artisan queue:work --tries=5
php artisan schedule:work
```

Production process-manager/cron guidance is in [DEPLOYMENT.md](../DEPLOYMENT.md).

## Validation and build commands

```bash
npm run lint:check
npm run format:check
npm run types:check
composer lint:check
composer types:check
php artisan test
npm run deploy:assets
```

`composer test` additionally runs Pint and PHPStan before PHPUnit. Tests cover storefront commerce, admin modules, rituals, delivery pricing, payment lifecycle/D-Gateway notifications, n8n checkout sessions and events, newsletters, authentication, settings, and deployment assets.

## Security and operations

- Use HTTPS, `APP_ENV=production`, `APP_DEBUG=false`, and secure session-cookie settings in production.
- Limit administrator access, require two-factor authentication, and retain recovery codes offline.
- Run workers and the scheduler continuously; without them payment reconciliation and queued notifications will not complete.
- Keep uploaded media persistent across deployments; the default public disk requires `php artisan storage:link`.
- Deploy `public/build/manifest.json` and the matching hashed `public/build/assets` directory atomically.
- Back up the database daily to encrypted, off-machine storage and test restoration periodically.

See [security operations](security-operations.md), [D-Gateway and delivery setup](dgateway-delivery-setup.md), and [deployment guide](../DEPLOYMENT.md) for operational detail.
