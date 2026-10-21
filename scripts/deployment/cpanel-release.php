<?php

declare(strict_types=1);

// Fixed, reviewed host layout. CLI only; never place this file in public_html.
if (PHP_SAPI !== 'cli') { exit(1); }
umask(0077);
require __DIR__.'/HostControls.php';
require __DIR__.'/ReleaseTransaction.php';

use Ellena\Deployment\HostControls;
use Ellena\Deployment\ReleaseTransaction;

const HOME_DIR = '/home2/ellenaco';
const LIVE = HOME_DIR.'/ellena';
const WEB = HOME_DIR.'/public_html';
const STATE = HOME_DIR.'/ellena-live-release-20261020';
const ARCHIVE = HOME_DIR.'/ellena-release-20261017.zip';
const ARCHIVE_HASH = '7c0ff27dcb865218f4c9136a6aeed82210e86614408444e572dc6c3a6a8ace41';
const DATABASE = 'ellenaco_ellenaDB';
const MIGRATION = '2026_09_29_000001_add_delivery_zones_and_payment_attempts';

function ensure(bool $condition, string $message): void {
    if (!$condition) { throw new RuntimeException($message); }
}
function command(array $args, ?string $input = null, ?string $output = null, array $env = []): string {
    $p = proc_open($args, [0 => ['file', $input ?? '/dev/null', 'r'], 1 => $output ? ['file', $output, 'w'] : ['pipe', 'w'], 2 => ['file', STATE.'/commands.err', 'a']], $pipes, null, $env ? array_merge(getenv(), $env) : null);
    ensure(is_resource($p), 'Cannot start host command');
    $text = $output ? '' : stream_get_contents($pipes[1]);
    if (!$output) { fclose($pipes[1]); }
    ensure(proc_close($p) === 0, 'Host command failed: '.basename($args[0]).'; inspect private commands.err');
    return $text;
}
function save(string $name, mixed $data): void {
    $text = json_encode($data, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR);
    $h = fopen(STATE.'/'.$name, 'xb');
    ensure($h !== false, 'State file already exists: '.$name);
    ensure(fwrite($h, $text) === strlen($text) && fflush($h) && fsync($h), 'Cannot persist state');
    fclose($h);
}
function readState(string $name): mixed {
    return json_decode(file_get_contents(STATE.'/'.$name), true, 512, JSON_THROW_ON_ERROR);
}
function present(string $path): bool { return file_exists($path) || is_link($path); }
function manifest(string $path): array {
    if (!present($path)) { return ['absent']; }
    if (is_link($path)) { return ['link', readlink($path)]; }
    if (is_file($path)) { return ['file', fileperms($path) & 0777, hash_file('sha256', $path)]; }
    $out = ['mode' => fileperms($path) & 0777];
    foreach (scandir($path) as $name) {
        if ($name !== '.' && $name !== '..') { $out[$name] = manifest($path.'/'.$name); }
    }
    return $out;
}
function databaseConfig(): array {
    require_once LIVE.'/vendor/autoload.php';
    $app = require LIVE.'/bootstrap/app.php';
    (new Illuminate\Foundation\Bootstrap\LoadEnvironmentVariables)->bootstrap($app);
    (new Illuminate\Foundation\Bootstrap\LoadConfiguration)->bootstrap($app);
    $c = $app['config']->get('database.connections.mysql');
    ensure($c['database'] === DATABASE && empty($c['url']), 'Unexpected database configuration');
    return $c;
}
function db(array $c): PDO {
    $pdo = new PDO('mysql:host='.$c['host'].';port='.($c['port'] ?: 3306).';dbname='.DATABASE.';charset=utf8mb4', $c['username'], $c['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    ensure($pdo->query('SELECT DATABASE()')->fetchColumn() === DATABASE, 'Database identity check failed');
    return $pdo;
}
function tables(PDO $pdo): array {
    $names = [];
    foreach ($pdo->query('SHOW FULL TABLES')->fetchAll(PDO::FETCH_NUM) as $row) {
        ensure($row[1] === 'BASE TABLE' && (bool)preg_match('/^[a-zA-Z0-9_]+$/D', $row[0]), 'Unsupported database object');
        $names[] = $row[0];
    }
    sort($names);
    return $names;
}
function fingerprint(PDO $pdo): array {
    $out = [];
    foreach (tables($pdo) as $name) {
        $schema = $pdo->query('SHOW CREATE TABLE `'.$name.'`')->fetch(PDO::FETCH_NUM)[1];
        $rows = [];
        foreach ($pdo->query('SELECT * FROM `'.$name.'`', PDO::FETCH_NUM) as $row) { $rows[] = hash('sha256', serialize($row)); }
        sort($rows);
        $out[$name] = [hash('sha256', $schema), count($rows), hash('sha256', implode('', $rows))];
    }
    return $out;
}
function mysqlArgs(array $c): array {
    return ['--host='.$c['host'], '--port='.($c['port'] ?: 3306), '--user='.$c['username']];
}
function webCheck(bool $closed): void {
    foreach (['ellenacosms.com', 'www.ellenacosms.com', 'admin.ellenacosms.com'] as $host) {
        $ok = false;
        for ($i = 0; $i < 8; $i++) {
            $curl = curl_init('https://'.$host.'/?release_check='.bin2hex(random_bytes(6)));
            curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8, CURLOPT_FOLLOWLOCATION => false, CURLOPT_HTTPHEADER => ['Cache-Control: no-cache']]);
            $body = curl_exec($curl); $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE); curl_close($curl);
            $ok = $closed ? ($status === 503 && is_string($body) && str_contains($body, 'shop is being updated')) : in_array($status, [200, 301, 302, 303], true);
            if ($ok) { break; }
            sleep(2);
        }
        ensure($ok, 'HTTP maintenance verification failed for '.$host);
    }
}
function smoke(bool $new): void {
    command([PHP_BINARY, __DIR__.'/release-smoke.php', $new ? 'new' : 'old']);
}

try {
    ensure(is_dir(STATE) && !is_link(STATE) && (fileperms(STATE) & 0077) === 0, 'Private state directory is required');
    $lock = fopen(STATE.'/lock', 'c');
    ensure(flock($lock, LOCK_EX | LOCK_NB), 'Another release is active');
    $mode = $argv[1] ?? 'inspect';
    ensure(in_array($mode, ['prepare', 'activate'], true), 'Usage: cpanel-release.php prepare|activate');
    $controls = new HostControls(WEB.'/.htaccess', STATE, LIVE,
        fn () => command(['crontab', '-l']),
        function (string $text): void {
            file_put_contents(STATE.'/cron-input', $text);
            command(['crontab', STATE.'/cron-input']);
        });

    if ($mode === 'prepare') {
        ensure(!file_exists(STATE.'/release.jsonl') && !file_exists(STATE.'/prepared.json'), 'Existing release state requires inspection');
        ensure(hash_file('sha256', ARCHIVE) === ARCHIVE_HASH, 'Release archive hash mismatch');
        ensure(realpath(LIVE) === LIVE && realpath(WEB) === WEB, 'Unexpected live paths');
        ensure(is_file(HOME_DIR.'/ellena-backups/mysql-rehearsal-20261019-113053/report.json'), 'MySQL rehearsal evidence missing');
        ensure(readStateFile(HOME_DIR.'/ellena-backups/mysql-rehearsal-20261019-113053/report.json')['result'] === 'PASS', 'MySQL rehearsal did not pass');
        ensure(readStateFile(HOME_DIR.'/ellena-backups/ellena-release-probe-4f6563f83411c07d8f456b13/report.json')['result'] === 'PASS', 'HTTP rehearsal did not pass');
        $c = databaseConfig(); $pdo = db($c);
        ensure(!$pdo->query("SELECT COUNT(*) FROM migrations WHERE migration='".MIGRATION."'")->fetchColumn(), 'Migration already applied; inspect instead of redeploying');
        ensure($pdo->query('SHOW TRIGGERS')->fetchAll() === [], 'Triggers require a different backup plan');
        ensure($pdo->query('SHOW EVENTS')->fetchAll() === [], 'Events require a different writer/backup plan');
        ensure(!in_array('delivery_zones', tables($pdo), true) && !in_array('payment_attempts', tables($pdo), true), 'Partially migrated schema');
        save('db-config.json', $c);
        mkdir(STATE.'/package', 0700); mkdir(STATE.'/ready', 0700); mkdir(STATE.'/old', 0700); mkdir(STATE.'/failed', 0700);
        command(['unzip', '-q', ARCHIVE, '-d', STATE.'/package']);
        foreach ([
            'CheckoutController.php' => ['app/Http/Controllers/CheckoutController.php', '0f0846bace849cccff4b217fe8cdc77eb62252e6e4dd3c41736226336d879fe3'],
            'checkout.php' => ['config/checkout.php', '7079d03cfe0652e408a6408d28118623622152b2d147efb195b32918cb790fef'],
        ] as $file => [$target, $hash]) {
            ensure(hash_file('sha256', __DIR__.'/'.$file) === $hash, 'Reviewed checkout patch hash mismatch');
            ensure(copy(__DIR__.'/'.$file, STATE.'/package/'.$target), 'Cannot apply reviewed checkout cleanup');
        }
        $map = [];
        foreach (['app', 'config', 'routes', 'resources', 'vendor', 'bootstrap', 'database/migrations'] as $name) { $map[] = [STATE.'/package/'.$name, LIVE.'/'.$name]; }
        $map[] = [STATE.'/package/public/build', LIVE.'/public/build'];
        foreach (['build', 'images', 'apple-touch-icon.png', 'brand-logo.png', 'favicon.ico', 'favicon.svg', 'robots.txt'] as $name) {
            if (present(STATE.'/package/public/'.$name)) { $map[] = [STATE.'/package/public/'.$name, WEB.'/'.$name]; }
        }
        $map[] = [STATE.'/package/artisan', LIVE.'/artisan'];
        foreach (['composer.json', 'composer.lock'] as $name) { $map[] = [STATE.'/package/'.$name, LIVE.'/'.$name]; }
        $items = [];
        foreach ($map as $i => [$source, $target]) {
            ensure(present($source) && !is_link($target), 'Missing release input or unexpected symlink: '.$target);
            command(['cp', '-a', $source, STATE.'/ready/'.$i]);
            command(['chmod', '-R', 'u=rwX,go=rX', STATE.'/ready/'.$i]);
            // Bootstrap caches must be rebuilt for final paths, never copied from staging.
            if ($target === LIVE.'/bootstrap') {
                if (is_dir(STATE.'/ready/'.$i.'/cache')) { rename(STATE.'/ready/'.$i.'/cache', STATE.'/package-bootstrap-cache'); }
                mkdir(STATE.'/ready/'.$i.'/cache', 0755); chmod(STATE.'/ready/'.$i.'/cache', 0755);
            }
            $items[] = ['target' => $target, 'before' => manifest($target), 'ready' => manifest(STATE.'/ready/'.$i)];
        }
        $env = file_get_contents(LIVE.'/.env');
        ensure($env !== false, 'Missing production environment');
        $env = preg_replace('/^CHECKOUT_PAYMENTS_PAUSED=.*\R?/m', '', $env);
        $i = count($items);
        file_put_contents(STATE.'/ready/'.$i, rtrim($env)."\nCHECKOUT_PAYMENTS_PAUSED=true\n");
        chmod(STATE.'/ready/'.$i, 0600);
        $items[] = ['target' => LIVE.'/.env', 'before' => manifest(LIVE.'/.env'), 'ready' => manifest(STATE.'/ready/'.$i)];
        // Retain compiled views for exact rollback; new code gets a fresh cache.
        $i = count($items);
        mkdir(STATE.'/ready/'.$i, 0755); chmod(STATE.'/ready/'.$i, 0755);
        $items[] = ['target' => LIVE.'/storage/framework/views', 'before' => manifest(LIVE.'/storage/framework/views'), 'ready' => manifest(STATE.'/ready/'.$i)];
        save('items.json', $items);
        $controls->prepare();
        save('prepared.json', ['archive' => ARCHIVE_HASH, 'time' => gmdate(DATE_ATOM)]);
        echo "RELEASE_PREPARED; live site unchanged\n";
        exit;
    }

    ensure(!file_exists(STATE.'/release.jsonl'), 'Existing journal: inspect recovery state; do not restart');
    $items = readState('items.json');
    $c = readState('db-config.json');
    $record = function (string $event, array $details): void {
        $h = fopen(STATE.'/release.jsonl', 'ab');
        $line = json_encode(['time' => gmdate(DATE_ATOM), 'event' => $event, ...$details], JSON_THROW_ON_ERROR)."\n";
        ensure($h && fwrite($h, $line) === strlen($line) && fflush($h) && fsync($h), 'Journal write failed');
        fclose($h);
        echo $event.' '.($details['operation'] ?? '').PHP_EOL;
        flush();
    };
    $ops = [
        'preflight' => function () use ($items): void {
            ensure(readState('prepared.json')['archive'] === ARCHIVE_HASH, 'Unprepared release');
            ensure(hash_file('sha256', ARCHIVE) === ARCHIVE_HASH, 'Release hash changed');
            foreach ($items as $i => $item) {
                ensure(manifest($item['target']) === $item['before'], 'Live files changed since preparation: '.$item['target']);
                ensure(manifest(STATE.'/ready/'.$i) === $item['ready'], 'Prepared files changed');
            }
            smoke(false);
        },
        'close_gate' => function () use ($controls): void { sleep(2); $controls->closeGate(); webCheck(true); },
        'stop_writers' => fn () => $controls->stopWriters(),
        'verify_quiescent' => function () use ($controls, $c): void {
            $controls->assertClosed(); $controls->assertWritersStopped(); webCheck(true);
            $clear = 0;
            for ($i = 0; $i < 30; $i++) {
                $processes = command(['ps', '-u', 'ellenaco', '-o', 'pid=,comm=']);
                $busy = false;
                foreach (explode("\n", trim($processes)) as $line) {
                    if (preg_match('/^\s*(\d+)\s+(\S+)/', $line, $m) && (int)$m[1] !== getmypid() && preg_match('/php|lsphp|node/i', $m[2])) { $busy = true; }
                }
                $pdo = db($c); $id = $pdo->query('SELECT CONNECTION_ID()')->fetchColumn();
                foreach ($pdo->query('SHOW PROCESSLIST') as $process) {
                    if ((int)$process['Id'] !== (int)$id && $process['db'] === DATABASE) { $busy = true; }
                }
                $pdo = null;
                $clear = $busy ? 0 : $clear + 1;
                if ($clear >= 3) { return; }
                sleep(5);
            }
            throw new RuntimeException('Requests or workers did not drain; no migration allowed');
        },
        'snapshot' => function () use ($c): void {
            ensure(!file_exists(STATE.'/database.sql'), 'Snapshot already exists');
            $pdo = db($c);
            save('database-before.json', fingerprint($pdo));
            command(array_merge(['/bin/mysqldump'], mysqlArgs($c), ['--single-transaction', '--no-tablespaces', '--hex-blob', '--skip-triggers', DATABASE]), null, STATE.'/database.sql', ['MYSQL_PWD' => $c['password']]);
            $sql = file_get_contents(STATE.'/database.sql');
            ensure(!preg_match('/^\s*(?:\/\*!\d+\s*)?(?:USE\s+|(?:CREATE|DROP)\s+DATABASE\b)/mi', $sql), 'Dump unexpectedly changes database');
            ensure(fingerprint($pdo) === readState('database-before.json'), 'Database changed during snapshot');
            command(['tar', '-czpf', STATE.'/files.tar.gz', '--exclude=ellena/node_modules', '--exclude=ellena/.git', '--exclude=ellena/tmp', '-C', HOME_DIR, 'ellena', 'public_html']);
            save('snapshot.json', ['database' => hash_file('sha256', STATE.'/database.sql'), 'files' => hash_file('sha256', STATE.'/files.tar.gz')]);
        },
        'verify_snapshot' => function (): void {
            $s = readState('snapshot.json');
            ensure(hash_file('sha256', STATE.'/database.sql') === $s['database'] && filesize(STATE.'/database.sql') > 100, 'Database snapshot corrupt');
            command(['tar', '-tzf', STATE.'/files.tar.gz'], null, STATE.'/archive-list.txt');
            ensure(hash_file('sha256', STATE.'/files.tar.gz') === $s['files'], 'File snapshot corrupt');
        },
        'migrate' => function (): void {
            command([PHP_BINARY, LIVE.'/artisan', 'migrate', '--force', '--realpath', '--path='.STATE.'/package/database/migrations/'.MIGRATION.'.php']);
        },
        'install_files' => function () use ($items, $controls): void {
            $controls->assertClosed();
            foreach ($items as $i => $item) {
                $target = $item['target'];
                if (present($target)) { ensure(rename($target, STATE.'/old/'.$i), 'Cannot retain original file tree'); }
                ensure(rename(STATE.'/ready/'.$i, $target), 'Cannot install prepared file tree');
            }
        },
        'rebuild_caches' => function (): void {
            foreach (['config:cache', 'route:cache', 'view:cache'] as $task) { command([PHP_BINARY, LIVE.'/artisan', $task]); }
        },
        'verify_release' => function () use ($controls, $c): void {
            $controls->assertClosed(); $controls->assertWritersStopped(); webCheck(true);
            ensure((bool)db($c)->query("SELECT COUNT(*) FROM migrations WHERE migration='".MIGRATION."'")->fetchColumn(), 'Migration missing');
            smoke(true);
        },
        'restore_files' => function () use ($items, $controls): void {
            $controls->assertClosed();
            foreach (array_reverse(array_keys($items)) as $i) {
                $item = $items[$i]; $target = $item['target'];
                if (present(STATE.'/old/'.$i)) {
                    if (present($target)) { ensure(rename($target, STATE.'/failed/'.$i), 'Cannot quarantine failed files'); }
                    ensure(rename(STATE.'/old/'.$i, $target), 'Cannot restore original files');
                } elseif ($item['before'] === ['absent'] && !present(STATE.'/ready/'.$i) && present($target)) {
                    ensure(rename($target, STATE.'/failed/'.$i), 'Cannot retire newly added files');
                }
                ensure(manifest($target) === $item['before'], 'Restored file manifest mismatch: '.$target);
            }
        },
        'restore_database' => function () use ($c, $controls): void {
            $controls->assertClosed(); $controls->assertWritersStopped();
            ensure(hash_file('sha256', STATE.'/database.sql') === readState('snapshot.json')['database'], 'Refusing corrupt database snapshot');
            $pdo = db($c); $baseline = readState('database-before.json');
            $extras = array_values(array_diff(tables($pdo), array_keys($baseline)));
            ensure(array_diff($extras, ['delivery_zones', 'payment_attempts']) === [], 'Unexpected new tables; manual recovery required');
            $pdo->exec('SET FOREIGN_KEY_CHECKS=0');
            foreach ($extras as $name) { $pdo->exec('DROP TABLE `'.$name.'`'); }
            $pdo->exec('SET FOREIGN_KEY_CHECKS=1');
            command(array_merge(['/bin/mysql'], mysqlArgs($c), ['--database='.DATABASE]), STATE.'/database.sql', STATE.'/restore-db.log', ['MYSQL_PWD' => $c['password']]);
            ensure(fingerprint($pdo) === $baseline, 'Database restoration mismatch');
        },
        'verify_restored' => function () use ($items, $c): void {
            foreach ($items as $item) { ensure(manifest($item['target']) === $item['before'], 'Original files not restored'); }
            if (file_exists(STATE.'/database-before.json')) { ensure(fingerprint(db($c)) === readState('database-before.json'), 'Original database not restored'); }
            smoke(false);
        },
        'open_gate' => function () use ($controls): void { sleep(2); $controls->openGate(); webCheck(false); },
        'start_writers' => fn () => $controls->startWriters(),
    ];
    $result = (new ReleaseTransaction($ops, $record))->run();
    $record('complete', ['result' => $result]);
    echo strtoupper($result).PHP_EOL;
    exit($result === 'deployed' ? 0 : 1);
} catch (Throwable $e) {
    // Never print credential-bearing stack traces, and never reopen here.
    fwrite(STDERR, 'RELEASE STOPPED: '.$e->getMessage().PHP_EOL);
    exit(1);
}
function readStateFile(string $path): array {
    return json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
}
