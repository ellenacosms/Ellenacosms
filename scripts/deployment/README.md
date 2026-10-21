# Release recovery runner

This runner replaces the rejected activation script's recovery control flow.
It does **not** run migrations, change hosting, or reopen the site by itself.
It requires a complete, reviewed host operation plan. `cpanel-release.php` is
the fixed October 20 host transaction, executed successfully on cPanel.

Run the failure tests locally:

```powershell
php vendor/bin/phpunit tests/Unit/ReleaseTransactionTest.php
```

Run a reviewed host plan on the server:

```sh
php scripts/deployment/run.php /private/release-plan.json
```

The JSON has `state_directory` (an existing private directory outside every web
root) and `operations`, mapping every operation below to a command argument
array. For example, `["/usr/local/bin/php", "/private/release/host.php", "snapshot"]`.
Commands run without shell interpolation, must return nonzero on failure, and
must not send secrets to stdout. Logs and the journal are private. Use one state
directory for the release, including recovery; do not evade an existing journal
by starting the same release with a new directory.

## Required host operation contracts

| Operation | Required behavior |
| --- | --- |
| `preflight` | Verify the exact release hash, staging results, capacity, public roots, PHP compatibility, pending migrations and rehearsed restore scripts. Refuse an interrupted release. |
| `close_gate` | Idempotently serve maintenance from an entry point independent of the application being replaced; cover storefront, admin, APIs and callbacks. Preserve the gate across file swaps. |
| `stop_writers` | Idempotently pause the app's scheduler and queue workers, preserving their prior configuration. Do not stop unrelated applications. |
| `verify_quiescent` | Prove jobs and in-flight requests have drained; fail if the write-free window cannot be established. |
| `snapshot` | Create fresh, non-overwriting backups of the exact current files, production environment, uploads and MySQL database after writers stop. Record schema, data and file checksums. |
| `verify_snapshot` | Verify file archive integrity and successful database dump completion. Confirm restoration has been rehearsed in an isolated MySQL database. A nonempty dump alone is insufficient. |
| `migrate` | Run only the reviewed pending migration(s). Never use fresh/reset commands. Partial failure must return nonzero. |
| `install_files` | Install the verified release while preserving the production environment, uploads and independent maintenance gate. |
| `rebuild_caches` | Rebuild caches at the final application paths. Do not restart writers or remove maintenance. |
| `verify_release` | Check the application, expected database schema, assets, admin access, cart and payment pause using private access while public maintenance remains active. |
| `restore_files` | Restore the complete matching file snapshot, including assets and configuration, while preserving the independent maintenance gate. Must work after a partial swap. |
| `restore_database` | Restore the matching database snapshot, including removal of release-created schema absent from the snapshot. Use saved credentials outside the swapped application; fail on any restore error. |
| `verify_restored` | Verify file checksums, database schema/data and old-site health together. Also supports an untouched application when a pre-mutation step failed. |
| `open_gate` | Remove only the maintenance gate. No migration, file swap or cache rebuild is allowed here. |
| `start_writers` | Restore the prior scheduler and worker configuration. Do not change app data or schema as part of reopening. |

## Failure handling

Before reopening, a failed mutation triggers both file and database restoration.
The runner attempts both even if the first restore fails. Either restore failure,
or a verification failure, prevents reopening. Failure to establish a write-free
recovery window prevents restoration itself.

Reopening begins only after all deployment or recovery checks pass. If opening
or restarting workers partially fails, the runner attempts to close access and
stop writers again. It halts for investigation without restoring an older
database over possible new customer writes. This is a contained operational
failure, not a successful deployment or rollback.

The durable journal records step starts and completions. A second run refuses
an existing journal, including after a process crash. Inspect actual hosting
state and complete recovery under maintenance; never automatically call
`artisan up` from an unconditional cleanup/trap.

## Current validation boundary

Automated tests exercise real file and SQLite snapshot restoration with injected
migration, install, cache, health-check, restore, writer and journal failures.
They do not establish that cPanel file extraction or MySQL restoration works.
On 19 October 2026, `rehearse-mysql.php` passed on cPanel using the isolated
`ellenaco_rehearsal_20261019` database: initial restore, the September delivery
zone/payment-attempt migration, injected clone data, and full restoration of
28 tables / 329 rows with exact schema and row-hash matches. It reads production
only to create a fresh dump. Triggers, routines and events are outside this test.
The script refuses a nonempty destination and cannot be rerun against the retained
clone without deliberate preparation. It is a host-specific rehearsal, not a
production restoration command.

Server evidence: `/home2/ellenaco/ellena-backups/mysql-rehearsal-20261019-113053/report.json`.
The reviewed host-operation plan is still required before production activation.

For file restoration, use `tar -xpzf` inside a private parent directory. The `p`
flag matters: a restrictive backup umask otherwise changes restored permissions,
which `tar -dzf` correctly reports as a mismatch. Never extract a rehearsal into
the live application or document root, and never follow restored storage symlinks
when modifying test files.

The same day's cPanel file rehearsal restored the complete October 17 archive
into `/home2/ellenaco/ellena-backups/file-rehearsal-20261019`, altered only its
copied `ellena/artisan`, restored again with `-p`, and passed `tar -dzf` with no
differences. This verified archive recovery; production installation was
subsequently checked by the host transaction.

On October 20, `rehearse-controls.php` tested `HostControls.php` in a unique,
inert public probe folder. The shop, www and admin domains all returned HTTP
503 with the gate closed, then HTTP 200 with the expected probe contents after
reopening. The host did not immediately notice a same-second htaccess change;
the rehearsal now separates the writes and uses bounded HTTP verification
with unique query strings. Production operations must verify the actual HTTP
status before proceeding, not assume a successful file write took effect.

The real cron text was read and its pause/restore simulated in memory. Live
cron and the shop root htaccess were not modified. Probe files were moved
outside public_html afterward. Evidence:
`/home2/ellenaco/ellena-backups/ellena-release-probe-4f6563f83411c07d8f456b13/report.json`.

`HostControlsTest.php` checks exact restoration, idempotent closing/pausing,
preservation of unrelated jobs, rejection of unknown application cron commands,
and refusing to overwrite unexpected cron or htaccess changes. `HostControls`
is a component used by `cpanel-release.php`, which wires writer draining, fresh
snapshots, installation and private health checks.

## Completed production activation

The October 20 transaction completed with `deployed`: HTTP maintenance verified,
cron paused, three consecutive checks without other PHP/Node processes or
database connections, fresh backups verified, the reviewed migration applied,
files installed, caches rebuilt and private routes/assets checked before HTTP
reopened and cron was restored.

Evidence and backups: `/home2/ellenaco/ellena-live-release-20261020`.
Executed script: `/home2/ellenaco/ellena-controls-20261019/cpanel-release-v2.php`.
Public checkout showed the payment-pause message and admin sign-in loaded.
Local targeted validation: 35 tests, 250 assertions passed.

Do not rerun the completed transaction. After traffic reopens, its database
snapshot is historical and must not be restored automatically.
