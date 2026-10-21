<?php

declare(strict_types=1);

// CLI-only. Host operation scripts must be reviewed and rehearsed separately.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__.'/ReleaseTransaction.php';

use Ellena\Deployment\ReleaseTransaction;

umask(0077);
$planFile = $argv[1] ?? '';
if (! is_file($planFile)) {
    fwrite(STDERR, "Usage: php scripts/deployment/run.php /private/reviewed-release.json\n");
    exit(2);
}

try {
    $plan = json_decode(file_get_contents($planFile), true, 512, JSON_THROW_ON_ERROR);
    $configuredDirectory = $plan['state_directory'] ?? null;
    if (! is_string($configuredDirectory) || trim($configuredDirectory) === '') {
        throw new RuntimeException('An explicit private state_directory is required.');
    }
    $stateDirectory = realpath($configuredDirectory);
    if (! $stateDirectory || ! is_dir($stateDirectory)) {
        throw new RuntimeException('A private, existing state_directory is required.');
    }
    if (PHP_OS_FAMILY !== 'Windows' && (fileperms($stateDirectory) & 0077) !== 0) {
        throw new RuntimeException('State directory must be private (permissions 0700).');
    }
    $lock = fopen($stateDirectory.'/release.lock', 'c');
    if (! $lock || ! flock($lock, LOCK_EX | LOCK_NB)) {
        throw new RuntimeException('Another release owns this state directory.');
    }
    $journal = $stateDirectory.'/release.jsonl';
    // An interrupted run cannot silently start another migration or reopen.
    if (is_file($journal)) {
        throw new RuntimeException('Release journal already exists. Inspect/recover the previous run first.');
    }
    $operations = [];
    foreach (ReleaseTransaction::REQUIRED as $name) {
        $command = $plan['operations'][$name] ?? null;
        if (! is_array($command) || $command === [] || ! array_is_list($command)
            || count(array_filter($command, 'is_string')) !== count($command)) {
            throw new RuntimeException("{$name} requires an explicit command argument array.");
        }
        $operations[$name] = static function () use ($command, $name, $stateDirectory): void {
            // No shell interpolation. Logs stay in the private state directory.
            $process = proc_open($command, [0 => ['file', PHP_OS_FAMILY === 'Windows' ? 'NUL' : '/dev/null', 'r'],
                1 => ['file', $stateDirectory.'/'.$name.'.log', 'a'],
                2 => ['file', $stateDirectory.'/'.$name.'.log', 'a']], $pipes);
            if (! is_resource($process) || proc_close($process) !== 0) {
                throw new RuntimeException("Operation failed: {$name}; inspect its private log.");
            }
        };
    }
    $record = static function (string $event, array $details) use ($journal): void {
        $line = json_encode(['time' => gmdate(DATE_ATOM), 'event' => $event, ...$details], JSON_THROW_ON_ERROR)."\n";
        $handle = fopen($journal, 'ab');
        if (! $handle || fwrite($handle, $line) !== strlen($line) || ! fflush($handle) || ! fsync($handle)) {
            throw new RuntimeException('Unable to persist release journal.');
        }
        fclose($handle);
    };
    $result = (new ReleaseTransaction($operations, $record))->run();
    $record('complete', ['result' => $result]);
    echo $result.PHP_EOL;
    exit($result === 'deployed' ? 0 : 1);
} catch (Throwable $failure) {
    fwrite(STDERR, $failure->getMessage().PHP_EOL);
    exit(1);
}
