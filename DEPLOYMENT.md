# ELLENA production deployment

## Current release — October 20, 2026

The new release is live at `https://ellenacosms.com`. Checkout displays
“Visit shop to complete purchase” and `CHECKOUT_PAYMENTS_PAUSED=true` is set in
production. Public checkout and the admin sign-in page were verified.

The completed journal, fresh file/database backups and retained original code
are in `/home2/ellenaco/ellena-live-release-20261020`. Activation used
`/home2/ellenaco/ellena-controls-20261019/cpanel-release-v2.php`.
It completed with `deployed`; maintenance was removed and cron restored.
Do not rerun the completed release or restore its database over later activity.

## Recovery procedure

Use the fail-closed release coordinator in `scripts/deployment/run.php` with a
reviewed host-operation plan. See `scripts/deployment/README.md` for operation
contracts and the host rehearsal requirements. Do not use the earlier ad hoc
activation script: rollback must restore and verify both files and database
under maintenance before reopening. The isolated cPanel MySQL and file restore
rehearsals passed on October 19, 2026. HTTP maintenance controls passed on
October 20 for the shop, www and admin domains. Production activation then used
`scripts/deployment/cpanel-release.php` to drain writers, create fresh backups,
install files and verify health before reopening. This script is fixed to the
October 20 release; future deployments need new reviewed inputs and state.

## Temporary payment pause

Payments are paused by default. Keep `CHECKOUT_PAYMENTS_PAUSED=true` in the
production environment for the shop-only notice. Checkout submissions and new
gateway collections are blocked; existing payment verification still works.
Deploy the PHP changes and rebuilt `public/build` assets together, then run
`php artisan config:cache` so the setting takes effect. Restart long-running
application workers and the SSR renderer if used.

To resume checkout later, set `CHECKOUT_PAYMENTS_PAUSED=false` and rebuild the
configuration cache. This does not cancel payments already sent to the provider.

Do not upload local `.agents`, `.kilo`, `.git`, `.vscode`, `node_modules`, `tmp`,
logs, database copies, or nested checkouts (`ellena`, `Ellenacosms`). Preserve
the live `.env`, customer uploads, and database when deploying.

## Required release build

The deployed release must contain both:

- `public/build/manifest.json`
- every file under `public/build/assets/`

Run this before uploading or releasing:

```bash
npm ci
npm run build:ssr
composer install --no-dev --optimize-autoloader
```

Run migrations and cache rebuilding only through the reviewed release plan
after maintenance is verified, background writers are paused and drained, and
fresh backups are verified. Preserve the existing production storage links.

Before releasing, verify that `public/hot` is absent. This file is only for
the local Vite server and must never be uploaded to production:

```bash
test ! -f public/hot
```

Do not run `npm run build` after a release has started serving traffic unless
the whole `public/build` directory is replaced atomically. The manifest and
hashed assets must always come from the same build.

## Inertia server-side rendering

The SEO page metadata is server-rendered. After each `npm run build:ssr`, run
the generated renderer as a persistent process on the application server:

```bash
node /home/CPANEL_USER/ellena/bootstrap/ssr/ssr.js
```

Keep this process alive with the host's Node application manager or another
process supervisor. Laravel sends SSR requests to `127.0.0.1:13714`; if the
renderer is unavailable, it safely serves the normal client-rendered page.

## Document root

The website document root must be the application's `public` directory, not
the repository root.

Example:

```text
/var/www/ellena/public
```

Pointing the domain at the repository root can expose private application files
and prevents Laravel's front-controller routing from working correctly.

## Apache

Enable `mod_rewrite`, permit `.htaccess` overrides for the public directory,
and keep `public/.htaccess` in the deployed release.

```apache
<Directory /var/www/ellena/public>
    AllowOverride All
    Require all granted
</Directory>
```

## Nginx

Use `public/index.php` as the front controller:

```nginx
server {
    root /var/www/ellena/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

## cPanel environment

Set the production URL and generate a production application key in the cPanel
application environment file (normally outside `public_html`):

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://ellenacosms.com
GOOGLE_SITE_VERIFICATION=the-value-from-google-search-console
```

If the application is intentionally hosted below a path such as
`https://example.com/ellena`, set `ASSET_URL` to that same public base URL.

After changing environment values:

```bash
php artisan optimize:clear
php artisan optimize
```

Use the permanent public domain here. Do not deploy with an `ngrok-free.dev`
URL: payment callbacks, Google OAuth, n8n checkout links, email links, and
the sitemap must all use the same HTTPS domain.

Set the following URLs after the domain and certificate are active:

```dotenv
APP_URL=https://ellenacosms.com
GOOGLE_REDIRECT_URI="${APP_URL}/auth/google/callback"
DGATEWAY_API_URL=https://dgatewayapi.desispay.com
DGATEWAY_API_KEY=
DGATEWAY_WEBHOOK_URL="${APP_URL}/payments/dgateway/webhook"
```

## Search Console and Merchant Center

After deployment, verify the domain in Google Search Console with the
`GOOGLE_SITE_VERIFICATION` value above, then submit:

```text
https://ellenacosms.com/sitemap.xml
```

For Google Merchant Center, create a scheduled feed using:

```text
https://ellenacosms.com/merchant-feed.xml
```

Review the imported products in Merchant Center before enabling listings;
shipping costs and business-policy settings are configured in that account.

On InterServer/Linux, leave `GOOGLE_CA_BUNDLE`, `DGATEWAY_CA_BUNDLE`, and
`N8N_CA_BUNDLE` blank unless the PHP system certificate store is unavailable.
Never copy a `C:/laragon/...` certificate path to the server.

In cPanel, ensure the domain's document root points to the Laravel `public`
directory. If cPanel only permits `public_html` as the document root, keep the
application itself outside `public_html` and expose only the contents of its
`public` directory there.

## cPanel database account

Do not use MySQL `root` in production. In **cPanel → MySQL® Databases**, create
a dedicated database user, assign it to the Ellena database, and grant only the
privileges cPanel offers for that database. cPanel automatically prefixes both
names with your account name; use the exact prefixed values it displays.

Then configure the server `.env` with the cPanel database values:

```dotenv
DB_CONNECTION=mysql
DB_HOST=localhost
DB_DATABASE=cpanelaccount_ellena
DB_USERNAME=cpanelaccount_ellena_app
DB_PASSWORD=use-the-new-password
```

## cPanel queue processing

Order confirmations and n8n notifications use the database queue. Shared cPanel
hosting normally does not offer Supervisor, so create a cPanel **Cron Job** that
runs every minute:

```bash
* * * * * /usr/local/bin/php /home/CPANEL_USER/ellena/artisan queue:work database --once --tries=5 --sleep=1 >> /home/CPANEL_USER/ellena/storage/logs/queue-worker.log 2>&1
```

Replace `CPANEL_USER` and confirm the PHP binary path in cPanel’s **Terminal**:

```bash
which php
php /home/CPANEL_USER/ellena/artisan queue:failed
```

If your cPanel plan supports a persistent application process, use
`queue:work` instead; the one-minute cron approach is the safe baseline.

## Payment and integration acceptance test

For this temporary payment-pause release, verify that checkout displays
“Visit shop to complete purchase” and that new payment collection requests are
blocked. Do not initiate a live payment as a deployment test.

When payments are deliberately re-enabled, verify each item below using the
payment provider's test environment before accepting live orders:

1. Guest checkout creates an order and reserves stock.
2. D-Gateway test payments verify from the permanent HTTPS domain, including delivery. See [delivery and payment setup](docs/dgateway-delivery-setup.md).
3. Successful payment updates the order to `paid`, sends confirmation, and
   triggers the n8n order event.
4. Failed and expired payments restore stock exactly once.
5. n8n checkout links point to the permanent domain and reject invalid or
   replayed signatures.
6. Google OAuth accepts only the configured production callback URL.

## Uploaded product and banner images

Uploads use the `public` media disk by default. Keep `storage/app/public`
persistent between deployments and run `php artisan storage:link` once on the
server. On an ephemeral host, set `MEDIA_DISK=s3` and configure the `AWS_*`
environment values so uploaded images survive releases.

The uploader accepts images up to 8 MB. Ensure PHP's `upload_max_filesize` is
at least `8M` and `post_max_size` is large enough for multi-image product
uploads (for example, `64M`).
