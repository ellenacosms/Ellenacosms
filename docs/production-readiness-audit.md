> Historical audit: this describes the application before the September 2026 payment migration. For the current payment and delivery implementation, see [D-Gateway and delivery setup](dgateway-delivery-setup.md).

# Ellena Production Readiness Audit

Audit date: 2026-08-10  
Checklist: `laravel_production_readiness_scalability_checklist.md`  
Application: Laravel 13.21.1, PHP 8.5.9, MySQL 8.4.3, React/Inertia

## Executive Verdict

**Status: not ready for production traffic yet.**

The core commerce implementation is in good shape: authentication and admin
boundaries exist, checkout uses transactions and row locks, duplicate checkout
submissions are constrained, Pesapal results are verified server-side, payment
state changes are idempotent, mail work is queued, migrations are current, and
production caches can be generated.

The release is blocked by failing quality gates, a production JavaScript
security advisory, development-only environment settings, missing HTTP security
headers and secure-cookie enforcement, and the absence of proven backup,
monitoring, worker-supervision, load-testing, and recovery procedures.

## Automated Validation Snapshot

| Check | Result | Evidence |
|---|---|---|
| Laravel migrations | Pass | All 22 migrations have run against MySQL. |
| Production caches | Pass | `config:cache`, `route:cache`, and `view:cache` complete successfully. |
| Vite deployment assets | Pass | 117 manifest entries and their assets verified. |
| ESLint | Pass | Full frontend lint completed successfully. |
| TypeScript | Pass | `tsc --noEmit` completed successfully. |
| Prettier | **Fail** | Four files fail formatting: account order, inventory, product form, ritual form. |
| Laravel Pint | **Fail** | Four PHP files fail formatting. |
| PHPStan | **Fail** | Default 128 MB limit crashes; at 512 MB it reports 26 errors. |
| PHPUnit | **Fail** | 99/102 tests pass; one failure and two errors remain. |
| Composer audit | Pass | No PHP dependency advisories found. |
| npm production audit | **Fail** | One high and one moderate advisory through Vite/PostCSS/Nanoid. |
| Failed queue jobs | Pass locally | No failed jobs currently recorded. |

The PHPUnit failures are stale coverage after recent feature changes:

- Checkout tests do not provide the now-required verified user, checkout token,
  delivery method, and payment method.
- The repeatable seeder test expects two banners while the seeder now defines
  three.

These still block release because the configured CI workflow runs the same
failing quality gate.

## Checklist Status

| Checklist Area | Status | Assessment |
|---|---|---|
| Functional testing | Partial | Broad coverage exists, but the complete suite is red and no formal browser/UAT matrix is recorded. |
| Authentication and authorization | Strong | Fortify, verification, admin middleware, customer scoping, throttling, 2FA, and passkeys are present. Production OAuth still needs domain-level testing. |
| Security | Blocked | CSRF, upload validation, and rate limits exist. Security headers, HTTPS enforcement, secure cookies, and a clean dependency audit do not. |
| Database and integrity | Partial | Transactions, locks, unique constraints, and foreign keys are strong. Large-data, backup, restore, and index-plan testing are absent. |
| Validation and errors | Partial | Controllers validate input, but custom 403/404/419/429/500/503 pages are absent. |
| Payments | Strong but unproven live | Browser values are not trusted; amount/currency are checked and state changes are locked. Live Pesapal failure/replay testing remains external. |
| Third-party integrations | Partial | Google, SMTP, Mailchimp, and Pesapal are implemented. Production credential/domain smoke tests are not documented. |
| Responsive/browser testing | Partial | Chrome desktop/mobile was reviewed. Edge, Firefox, Safari, Android, and iOS evidence is missing. |
| Deployment | Partial | Deployment and asset instructions exist and cache generation works. No automated release, rollback, or environment validation gate exists. |
| Logging and monitoring | Blocked | Local single-file debug logging is configured. No error tracker, metrics, alerts, queue monitoring, or disk/log-growth alerting is configured. |
| Load and scalability | Blocked | No k6/JMeter/Locust/Artillery plan, performance targets, or load/stress/spike/soak results exist. |
| Resilience and recovery | Blocked | No tested backups, restore drill, failover test, rollback drill, or worker/API failure exercise exists. |
| UAT and release gates | Not started | No signed UAT record or production smoke-test runbook exists. |

## Existing Strengths

### Commerce and payment correctness

- Checkout validates a session UUID and enforces a unique checkout token before
  creating an order.
- User, product, and discount rows are locked during checkout to prevent stock
  overselling and duplicate discount usage.
- Payment callbacks and IPNs never mark an order paid from browser/provider
  callback fields alone; Ellena re-queries Pesapal.
- Paid transactions require matching merchant reference, tracking ID, currency,
  and amount.
- Payment lifecycle updates lock the order, prevent status regression, release
  or reserve stock once, and queue confirmation email after commit.
- Confirmation email uses a unique queued job with retries and backoff.

### Application controls

- Public write-heavy routes use throttling.
- Admin routes are grouped behind authentication and administrator middleware.
- Customer orders and checkout success pages enforce ownership.
- Product, ritual, and banner uploads validate image type, extension, and size.
- CSV import/export uses bounded files and chunked exports.
- Shop products and major admin lists use pagination and eager loading.
- `.env` and common sensitive files are excluded by `.gitignore` and blocked by
  the root Apache fallback configuration.

### Deployment foundation

- The deployment guide requires a `public` document root, optimized Composer
  autoloading, migrations, storage linking, production caches, and atomic Vite
  asset replacement.
- The application exposes Laravel's `/up` health endpoint.
- Pesapal reconciliation is scheduled every two minutes with overlap protection
  and single-server locking.
- Redis and S3 deployment paths are already described, although not active.

## Release Blockers (P0)

### 1. Restore a green quality gate

1. Format the four Prettier and four Pint failures.
2. Raise PHPStan's configured memory limit and fix all 26 reported errors.
3. Update the three stale storefront tests for the current checkout and seeder
   behavior.
4. Upgrade the Vite/PostCSS/Nanoid dependency chain and rerun both audits.
5. Require the complete CI workflow before deployment.

Exit criterion: `composer ci:check`, `composer audit`, and
`npm audit --omit=dev --audit-level=moderate` all exit successfully.

### 2. Create and enforce production configuration

The current local environment is intentionally unsuitable for deployment:

- `APP_ENV=local`
- `APP_DEBUG=true`
- a temporary ngrok `APP_URL`
- debug-level, single-file logging
- database sessions, cache, and queues
- local filesystem storage

Create a server-managed production environment with at least:

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-production-domain
LOG_CHANNEL=daily
LOG_LEVEL=warning
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
PESAPAL_CACHE_STORE=redis
MEDIA_DISK=s3
```

Do not store production secrets in a committed environment file.

### 3. Add transport and browser security controls

Runtime inspection found no application-provided CSP, HSTS,
`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, or
`Permissions-Policy` headers. HTTPS-only cookies are also not enabled in the
current environment.

Add a production security-header middleware, enforce HTTPS at the edge, set
secure cookies, and configure trusted production proxies instead of trusting
only localhost proxies. Build the CSP around the Pesapal iframe, Google popup,
Vite assets, and any analytics domains actually used.

### 4. Establish operations before taking orders

- Supervise queue workers and restart them automatically after deployment.
- Run `schedule:run` every minute from cron or the hosting scheduler.
- Configure centralized error reporting and alerts for HTTP 5xx, payment API
  failures, failed jobs, queue depth, response latency, database health, disk,
  CPU, and memory.
- Configure automated database and media backups.
- Perform and document a successful database/media restoration.
- Create an atomic deployment and rollback runbook.

Exit criterion: an operator can detect, roll back, restore, and recover the
system without relying on the developer's workstation.

## High-Priority Scalability Work (P1)

### Database indexes

The active product table only indexes category, SKU, slug, and the primary key.
Storefront queries repeatedly filter/sort by active, featured, category, price,
name, and creation time. Add indexes based on real query plans, likely including
combinations such as:

- products: `(is_active, is_featured, created_at)`
- products: `(is_active, category_id, created_at)`
- products: `(is_active, price, id)`
- orders: `(payment_provider, payment_status, payment_checked_at)`
- orders: `(user_id, created_at)`
- orders: `(status, created_at)` for admin views

Validate every index with `EXPLAIN`; do not add indexes blindly.

### Query and caching strategy

- Paginate customer dashboard orders and admin customer order history instead
  of loading the complete history into memory.
- Cache public categories, visible banners, home product edits, store settings,
  and admin aggregates with explicit invalidation after admin writes.
- Replace `%term%` multi-column catalog search with MySQL full-text search or a
  dedicated search engine before the catalog becomes large.
- Cache admin dashboard totals briefly rather than recalculating every visit.

### Shared and stateless infrastructure

- Move sessions, cache, queue locks, and Pesapal token locks to Redis.
- Store uploads on S3-compatible object storage and serve media/static assets
  through a CDN.
- Keep app instances stateless so a second instance can be added safely.
- Use a managed database with connection limits, slow-query monitoring, and
  tested backups.

## Performance and Resilience Plan (P1/P2)

Define business targets before testing. A reasonable initial staging baseline
to confirm with the business is:

```text
Normal traffic:          50 concurrent users
Expected launch peak:   200 concurrent users
Stress target:          400 concurrent users
Catalog p95:            < 500 ms
Checkout p95:           < 1,000 ms excluding Pesapal-hosted UI
Error rate:             < 1%
Availability target:    99.9%
```

Then add a repeatable load suite covering home, shop/search, product, login,
cart, checkout creation, and safe Pesapal test-mode flows. Run:

1. Baseline load test.
2. 2x peak stress test.
3. Sudden spike test.
4. 30-60 minute soak test.
5. Queue-worker interruption and recovery.
6. Pesapal/SMTP/Mailchimp timeout and retry tests.
7. Database restore drill.
8. Deployment rollback drill.

Never run destructive stress tests against the live store.

## Recommended Implementation Order

1. **Quality gate:** formatting, PHPStan, stale tests, npm advisories.
2. **Production security:** environment template, headers, HTTPS, secure cookies,
   trusted proxies, custom error pages.
3. **Operations:** Redis, supervised workers, scheduler, centralized logging,
   backups, restore and rollback runbooks.
4. **Database performance:** indexes, pagination, cache invalidation, query plans.
5. **Load and resilience:** targets, repeatable load suite, failure drills.
6. **Release validation:** staging integrations, cross-browser testing, UAT, and
   production smoke tests.

## Go-Live Decision

Do not accept real customer payments until all P0 items are complete. The code
has a solid commerce foundation, but production readiness depends equally on a
green release gate, secure runtime configuration, observable background
processes, recoverable data, and measured behavior under load.
