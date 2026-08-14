# ELLENA production deployment

## Required release build

The deployed release must contain both:

- `public/build/manifest.json`
- every file under `public/build/assets/`

Run this before uploading or releasing:

```bash
npm ci
npm run deploy:assets
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan storage:link
php artisan optimize
```

Do not run `npm run build` after a release has started serving traffic unless
the whole `public/build` directory is replaced atomically. The manifest and
hashed assets must always come from the same build.

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
PESAPAL_CALLBACK_URL="${APP_URL}/payments/pesapal/callback"
PESAPAL_IPN_URL="${APP_URL}/payments/pesapal/ipn"
PESAPAL_CANCELLATION_URL="${APP_URL}/dashboard#orders"
```

On InterServer/Linux, leave `GOOGLE_CA_BUNDLE`, `PESAPAL_CA_BUNDLE`, and
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

Before opening the store, run one controlled live transaction on the public
domain and verify each item below:

1. Guest checkout creates an order and reserves stock.
2. Pesapal opens from the permanent HTTPS domain.
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
