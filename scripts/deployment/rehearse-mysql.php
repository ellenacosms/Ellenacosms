<?php

// CLI-only, host-specific rehearsal. Never accepts a destination argument.
declare(strict_types=1);

if (PHP_SAPI !== 'cli') { exit(1); }
umask(0077);
const TARGET = 'ellenaco_rehearsal_20261019';
const SOURCE = 'ellenaco_ellenaDB';
const ROOT = '/home2/ellenaco';
require ROOT.'/ellena/vendor/autoload.php';
$app = require ROOT.'/ellena/bootstrap/app.php';
(new Illuminate\Foundation\Bootstrap\LoadEnvironmentVariables)->bootstrap($app);
(new Illuminate\Foundation\Bootstrap\LoadConfiguration)->bootstrap($app);
$c = $app['config']->get('database.connections.mysql');
if ($c['database'] !== SOURCE || TARGET === SOURCE) { throw new RuntimeException('Unexpected source database'); }
$dsn = 'mysql:host='.$c['host'].';port='.($c['port'] ?: '3306').';dbname=';
$db = new PDO($dsn.TARGET, $c['username'], $c['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
function guard(PDO $db): void {
    if ($db->query('SELECT DATABASE()')->fetchColumn() !== TARGET) { throw new RuntimeException('Destination guard failed'); }
}
function tables(PDO $db): array {
    guard($db);
    $rows = $db->query('SHOW FULL TABLES')->fetchAll(PDO::FETCH_NUM);
    foreach ($rows as $row) { if ($row[1] !== 'BASE TABLE' || !preg_match('/^[a-zA-Z0-9_]+$/D', $row[0])) { throw new RuntimeException('Unsupported table'); } }
    $names = array_column($rows, 0); sort($names); return $names;
}
function fingerprint(PDO $db): array {
    $result = [];
    foreach (tables($db) as $name) {
        $schema = $db->query('SHOW CREATE TABLE `'.$name.'`')->fetch(PDO::FETCH_NUM)[1];
        $rows = [];
        foreach ($db->query('SELECT * FROM `'.$name.'`', PDO::FETCH_NUM) as $row) { $rows[] = hash('sha256', serialize($row)); }
        sort($rows);
        $result[$name] = ['schema' => hash('sha256', $schema), 'rows' => count($rows), 'data' => hash('sha256', implode('', $rows))];
    }
    return $result;
}
if (tables($db) !== []) { throw new RuntimeException('Rehearsal database must be empty; refusing reuse'); }
$work = ROOT.'/ellena-backups/mysql-rehearsal-'.gmdate('Ymd-His');
if (!mkdir($work, 0700)) { throw new RuntimeException('Cannot create private report directory'); }
$dump = $work.'/snapshot.sql';
$baseArgs = ['--host='.$c['host'], '--port='.($c['port'] ?: '3306'), '--user='.$c['username']];
$env = array_merge(getenv(), ['MYSQL_PWD' => $c['password']]);
function process(array $cmd, string $input, string $output, array $env): void {
    $p = proc_open($cmd, [0 => ['file', $input, 'r'], 1 => ['file', $output, 'w'], 2 => ['pipe', 'w']], $pipes, null, $env);
    if (!is_resource($p)) { throw new RuntimeException('Cannot start database utility'); }
    $error = stream_get_contents($pipes[2]); fclose($pipes[2]);
    if (proc_close($p) !== 0) { throw new RuntimeException('Database utility failed; stopped without touching production'); }
}
// Consistent read-only snapshot; no triggers/routines/events are imported.
process(array_merge(['/bin/mysqldump'], $baseArgs, ['--single-transaction', '--no-tablespaces', '--hex-blob', '--skip-triggers', SOURCE]), '/dev/null', $dump, $env);
$sql = file_get_contents($dump);
if (strlen($sql) < 100 || preg_match('/^\s*(?:\/\*!\d+\s*)?(?:USE\s+|(?:CREATE|DROP)\s+DATABASE\b)/mi', $sql) || preg_match('/`'.SOURCE.'`\s*\./i', $sql)) { throw new RuntimeException('Unsafe or incomplete dump'); }
$import = static function () use ($db, $baseArgs, $dump, $work, $env): void {
    guard($db);
    process(array_merge(['/bin/mysql'], $baseArgs, ['--database='.TARGET]), $dump, $work.'/import.log', $env);
};
$import();
$before = fingerprint($db);
if (!$before) { throw new RuntimeException('No tables restored'); }
file_put_contents($work.'/baseline.json', json_encode($before, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
echo 'INITIAL_RESTORE_OK tables='.count($before).PHP_EOL;

// Register only the database provider. No application providers, jobs or events boot.
$c['database'] = TARGET; $c['url'] = null; unset($c['read'], $c['write']);
$app['config']->set('database.default', 'mysql');
$app['config']->set('database.connections', ['mysql' => $c]);
$app->register(Illuminate\Database\DatabaseServiceProvider::class);
Illuminate\Support\Facades\Facade::setFacadeApplication($app);
if ($app['db']->connection()->getDatabaseName() !== TARGET || $app['db']->selectOne('SELECT DATABASE() AS name')->name !== TARGET) { throw new RuntimeException('Migration guard failed'); }
$migration = require ROOT.'/ellena-release-20261017/database/migrations/2026_09_29_000001_add_delivery_zones_and_payment_attempts.php';
$migration->up();
if (!in_array('payment_attempts', tables($db), true) || !in_array('delivery_zones', tables($db), true)) { throw new RuntimeException('Migration verification failed'); }
echo 'MYSQL_MIGRATION_OK'.PHP_EOL;
guard($db);
$db->exec("INSERT INTO delivery_zones (country,district,area,minimum_days,maximum_days,is_active) VALUES ('REHEARSAL','REHEARSAL','REHEARSAL',1,3,1)");
if (fingerprint($db) === $before) { throw new RuntimeException('Failure injection did not change clone'); }
// Simulated deployment failure: remove clone-only schema and restore snapshot.
guard($db);
$db->exec('SET FOREIGN_KEY_CHECKS=0');
foreach (tables($db) as $name) { guard($db); $db->exec('DROP TABLE `'.$name.'`'); }
$db->exec('SET FOREIGN_KEY_CHECKS=1');
$import();
$after = fingerprint($db);
if ($before !== $after) { throw new RuntimeException('Restored schema/data differ from baseline'); }
$report = ['result' => 'PASS', 'target' => TARGET, 'source' => SOURCE, 'tables' => count($before), 'rows' => array_sum(array_column($before, 'rows')), 'dump_sha256' => hash_file('sha256', $dump), 'migration' => 'PASS', 'schema_and_data_restore' => 'EXACT_MATCH', 'production_modified' => false, 'scope' => 'base tables; triggers, routines and events excluded'];
file_put_contents($work.'/report.json', json_encode($report, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
echo 'MYSQL_REHEARSAL_PASS '.json_encode($report, JSON_THROW_ON_ERROR).PHP_EOL;
echo 'REPORT_DIRECTORY='.$work.PHP_EOL;
