# Security operations

## Admin access

Administrators must configure and confirm two-factor authentication before they can use `/admin`. Keep recovery codes offline and remove administrator access immediately when a staff member leaves.

## n8n checkout authentication

The checkout-session webhook requires these headers:

```text
X-N8N-Timestamp: Unix timestamp
X-N8N-Signature: sha256=<HMAC-SHA256(timestamp + "." + raw request body)>
```

Sign the unmodified JSON request body using `N8N_CHECKOUT_SESSION_SECRET`. Requests older than five minutes and duplicate signatures are rejected. Update the n8n workflow before using the endpoint again.

## Database access

Use a dedicated MySQL application account limited to the `ellena` schema. Do not run the web application with the MySQL `root` account. Keep MySQL bound to localhost or a private network only.

## Backups

Create encrypted daily MySQL backups outside the web root, copy them to access-controlled off-machine storage, and test restoring one at least quarterly. Store the backup encryption key separately from the backups.

## Deployment

Deploy behind a stable HTTPS domain and reverse proxy. Keep `APP_ENV=production`, `APP_DEBUG=false`, `APP_FORCE_HTTPS=true`, and secure session-cookie settings enabled. Rotate Google, Pesapal, SMTP, and n8n secrets that were previously exposed.
