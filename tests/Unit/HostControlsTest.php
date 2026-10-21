<?php

declare(strict_types=1);

namespace Tests\Unit;

use Ellena\Deployment\HostControls;
use PHPUnit\Framework\TestCase;
use RuntimeException;

require_once __DIR__.'/../../scripts/deployment/HostControls.php';

final class HostControlsTest extends TestCase
{
    private string $dir;
    private string $cron;
    private string $original;
    private HostControls $controls;

    protected function setUp(): void
    {
        $this->dir = sys_get_temp_dir().'/ellena-controls-'.bin2hex(random_bytes(6));
        mkdir($this->dir, 0700);
        file_put_contents($this->dir.'/.htaccess', "RewriteEngine On\n# cPanel settings remain\n");
        $this->original = $this->cron = "MAILTO=\"\"\n* * * * * /usr/local/bin/php /home2/ellenaco/ellena/artisan schedule:run >> schedule.log 2>&1\n* * * * * /usr/local/bin/php /home2/ellenaco/ellena/artisan queue:work database --once >> queue.log 2>&1\n0 1 * * * unrelated-backup\n";
        $this->controls = new HostControls($this->dir.'/.htaccess', $this->dir, '/home2/ellenaco/ellena', fn () => $this->cron, function (string $value): void { $this->cron = $value; });
    }

    protected function tearDown(): void
    {
        foreach (scandir($this->dir) as $file) {
            if ($file !== '.' && $file !== '..') { unlink($this->dir.'/'.$file); }
        }
        rmdir($this->dir);
    }

    public function test_control_cycle_preserves_unrelated_cron_and_cpanel_settings(): void
    {
        $htaccess = file_get_contents($this->dir.'/.htaccess');
        $this->controls->prepare();
        self::assertSame($htaccess, file_get_contents($this->dir.'/.htaccess'));
        self::assertSame($this->original, $this->cron);
        $this->controls->closeGate();
        $this->controls->closeGate();
        $this->controls->assertClosed();
        $this->controls->stopWriters();
        $this->controls->stopWriters();
        $this->controls->assertWritersStopped();
        self::assertStringContainsString("\n0 1 * * * unrelated-backup\n", $this->cron);
        self::assertSame(2, substr_count($this->cron, '# ELLENA RELEASE PAUSED'));
        self::assertSame(HostControls::GATE.$htaccess, file_get_contents($this->dir.'/.htaccess'));
        $this->controls->openGate();
        $this->controls->startWriters();
        self::assertSame($htaccess, file_get_contents($this->dir.'/.htaccess'));
        self::assertSame($this->original, $this->cron);
    }

    public function test_changed_cron_is_never_overwritten(): void
    {
        $this->controls->prepare();
        $this->cron .= "0 2 * * * new-job\n";
        $before = $this->cron;
        try { $this->controls->stopWriters(); self::fail('Expected conflict'); }
        catch (RuntimeException) { self::assertSame($before, $this->cron); }
    }

    public function test_changed_gate_is_never_overwritten(): void
    {
        $this->controls->prepare();
        $this->controls->closeGate();
        file_put_contents($this->dir.'/.htaccess', '# unexpected change');
        try { $this->controls->openGate(); self::fail('Expected conflict'); }
        catch (RuntimeException) { self::assertSame('# unexpected change', file_get_contents($this->dir.'/.htaccess')); }
    }

    public function test_unreviewed_ellena_job_prevents_preparation(): void
    {
        $this->cron .= '* * * * * /usr/local/bin/php /home2/ellenaco/ellena/artisan custom:write';
        $this->expectException(RuntimeException::class);
        $this->controls->prepare();
    }

    public function test_cannot_replace_an_existing_recovery_snapshot(): void
    {
        $this->controls->prepare();
        $this->expectException(RuntimeException::class);
        $this->controls->prepare();
    }
}
