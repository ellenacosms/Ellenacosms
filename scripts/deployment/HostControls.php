<?php

declare(strict_types=1);

namespace Ellena\Deployment;

use RuntimeException;

/** The gate stays in public_html and must never be overwritten by a file swap. */
final class HostControls
{
    public const GATE = "# BEGIN ELLENA RELEASE MAINTENANCE\nRewriteEngine On\nRewriteRule ^ - [R=503,L]\nErrorDocument 503 \"The shop is being updated. Please try again shortly.\"\n# END ELLENA RELEASE MAINTENANCE\n";

    public function __construct(
        private string $htaccess,
        private string $state,
        private string $application,
        private \Closure $readCron,
        private \Closure $writeCron,
    ) {}

    public static function pausedCron(string $original, string $application): string
    {
        $counts = ['schedule:run' => 0, 'queue:work' => 0];
        $lines = explode("\n", $original);
        foreach ($lines as &$line) {
            if (str_starts_with(ltrim($line), '#') || ! str_contains($line, $application.'/artisan')) {
                continue;
            }
            $matched = false;
            foreach ($counts as $command => &$count) {
                if (preg_match('~^\* \* \* \* \* /usr/local/bin/php '.preg_quote($application.'/artisan', '~').' '.preg_quote($command, '~').'(?:\s|$)~', $line)) {
                    $count++;
                    $matched = true;
                }
            }
            unset($count);
            if (! $matched) {
                throw new RuntimeException('Unreviewed Ellena cron command; refusing to change cron.');
            }
            $line = '# ELLENA RELEASE PAUSED '.$line;
        }
        unset($line);
        if ($counts !== ['schedule:run' => 1, 'queue:work' => 1]) {
            throw new RuntimeException('Expected exactly one scheduler and one queue worker.');
        }

        return implode("\n", $lines);
    }

    /** Save original control files before maintenance. This does not alter serving state. */
    public function prepare(): void
    {
        if (! is_dir($this->state) || is_link($this->state) || is_link($this->htaccess)) {
            throw new RuntimeException('Expected real state directory and htaccess file.');
        }
        if (PHP_OS_FAMILY !== 'Windows' && (fileperms($this->state) & 0077) !== 0) {
            throw new RuntimeException('State directory must be private.');
        }
        if (file_exists($this->state.'/controls.json')) {
            throw new RuntimeException('Control snapshot already exists; do not prepare over an interrupted release.');
        }
        $original = file_get_contents($this->htaccess);
        if ($original === false || str_contains($original, '# BEGIN ELLENA RELEASE')) {
            throw new RuntimeException('Cannot snapshot an existing maintenance gate.');
        }
        $cron = ($this->readCron)();
        $paused = self::pausedCron($cron, $this->application);
        $this->atomic($this->state.'/controls.json', json_encode([
            'htaccess' => $original,
            'htaccess_mode' => fileperms($this->htaccess) & 0777,
            'cron' => $cron,
            'paused_cron' => $paused,
        ], JSON_THROW_ON_ERROR), 0600);
    }

    public function closeGate(): void
    {
        $saved = $this->saved();
        $closed = self::GATE.$saved['htaccess'];
        $current = file_get_contents($this->htaccess);
        if ($current === $closed) {
            return;
        }
        if ($current !== $saved['htaccess']) {
            throw new RuntimeException('Htaccess changed after preflight; refusing overwrite.');
        }
        $this->atomic($this->htaccess, $closed, $saved['htaccess_mode']);
    }

    public function assertClosed(): void
    {
        if (file_get_contents($this->htaccess) !== self::GATE.$this->saved()['htaccess']) {
            throw new RuntimeException('Maintenance gate is not intact.');
        }
    }

    public function stopWriters(): void
    {
        $saved = $this->saved();
        $this->replaceCron($saved['cron'], $saved['paused_cron']);
    }

    public function assertWritersStopped(): void
    {
        if (($this->readCron)() !== $this->saved()['paused_cron']) {
            throw new RuntimeException('Cron is not in the reviewed paused state.');
        }
    }

    /** Only invoke after BOTH file/database verification and private health checks. */
    public function openGate(): void
    {
        $saved = $this->saved();
        $current = file_get_contents($this->htaccess);
        if ($current === $saved['htaccess']) {
            return;
        }
        $this->assertClosed();
        $this->atomic($this->htaccess, $saved['htaccess'], $saved['htaccess_mode']);
    }

    public function startWriters(): void
    {
        $saved = $this->saved();
        $this->replaceCron($saved['paused_cron'], $saved['cron']);
    }

    private function replaceCron(string $expected, string $replacement): void
    {
        $current = ($this->readCron)();
        if ($current === $replacement) {
            return;
        }
        if ($current !== $expected) {
            throw new RuntimeException('Cron changed unexpectedly; refusing to replace unrelated changes.');
        }
        ($this->writeCron)($replacement);
        if (($this->readCron)() !== $replacement) {
            throw new RuntimeException('Cron write did not persist.');
        }
    }

    private function saved(): array
    {
        return json_decode(file_get_contents($this->state.'/controls.json'), true, 512, JSON_THROW_ON_ERROR);
    }

    private function atomic(string $path, string $contents, int $mode): void
    {
        $tmp = $path.'.release-'.bin2hex(random_bytes(8));
        $handle = fopen($tmp, 'xb');
        if (! $handle || fwrite($handle, $contents) !== strlen($contents) || ! fflush($handle) || ! fsync($handle)) {
            throw new RuntimeException('Cannot persist control file.');
        }
        fclose($handle);
        if (! chmod($tmp, $mode) || ! rename($tmp, $path)) {
            throw new RuntimeException('Cannot atomically install control file.');
        }
    }
}
