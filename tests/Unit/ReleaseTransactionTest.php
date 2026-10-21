<?php

declare(strict_types=1);

namespace Tests\Unit;

use Ellena\Deployment\ReleaseTransaction;
use PDO;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use RuntimeException;

require_once __DIR__.'/../../scripts/deployment/ReleaseTransaction.php';

final class ReleaseTransactionTest extends TestCase
{
    private string $directory;

    private bool $gateClosed = false;

    private bool $writersStopped = false;

    private array $calls = [];

    protected function setUp(): void
    {
        $this->directory = sys_get_temp_dir().'/ellena-release-test-'.bin2hex(random_bytes(8));
        mkdir($this->directory, 0700);
        file_put_contents($this->directory.'/app', 'old release');
        $db = $this->db();
        $db->exec('CREATE TABLE orders (id INTEGER PRIMARY KEY, total INTEGER)');
        $db->exec('INSERT INTO orders VALUES (1, 125)');
    }

    protected function tearDown(): void
    {
        foreach (glob($this->directory.'/*') as $file) {
            unlink($file);
        }
        rmdir($this->directory);
    }

    public static function mutationFailures(): array
    {
        return array_map(fn ($step) => [$step], ['migrate', 'install_files', 'rebuild_caches', 'verify_release']);
    }

    #[DataProvider('mutationFailures')]
    public function test_partial_failure_restores_real_files_and_database_before_reopening(string $step): void
    {
        $result = $this->transaction([$step])->run();
        self::assertSame('rolled_back', $result);
        self::assertSame('old release', file_get_contents($this->directory.'/app'));
        self::assertSame(125, (int) $this->db()->query('SELECT total FROM orders')->fetchColumn());
        self::assertFalse($this->hasNewTable());
        self::assertLessThan(array_search('open_gate', $this->calls), array_search('verify_restored', $this->calls));
        self::assertFalse($this->gateClosed);
    }

    public function test_success_checks_updated_release_before_reopening(): void
    {
        self::assertSame('deployed', $this->transaction()->run());
        self::assertSame('new release', file_get_contents($this->directory.'/app'));
        self::assertTrue($this->hasNewTable());
        self::assertNotContains('restore_database', $this->calls);
        self::assertLessThan(array_search('open_gate', $this->calls), array_search('verify_release', $this->calls));
    }

    public static function recoveryFailures(): array
    {
        return [['restore_files'], ['restore_database'], ['verify_restored']];
    }

    #[DataProvider('recoveryFailures')]
    public function test_failed_recovery_never_reopens(string $step): void
    {
        try {
            $this->transaction(['verify_release', $step])->run();
            self::fail('Expected recovery to halt');
        } catch (RuntimeException $error) {
            self::assertStringContainsString('do not reopen automatically', $error->getMessage());
        }
        self::assertContains('restore_files', $this->calls);
        self::assertContains('restore_database', $this->calls);
        self::assertNotContains('open_gate', $this->calls);
        self::assertTrue($this->gateClosed);
        self::assertTrue($this->writersStopped);
    }

    public function test_unverified_snapshot_cannot_allow_migration(): void
    {
        self::assertSame('rolled_back', $this->transaction(['verify_snapshot'])->run());
        self::assertNotContains('migrate', $this->calls);
        self::assertNotContains('restore_database', $this->calls);
        self::assertContains('verify_restored', $this->calls);
    }

    public function test_running_writers_prevent_backup_and_migration(): void
    {
        $this->expectException(RuntimeException::class);
        try {
            $this->transaction(['verify_quiescent'])->run();
        } finally {
            self::assertNotContains('snapshot', $this->calls);
            self::assertNotContains('migrate', $this->calls);
            self::assertNotContains('open_gate', $this->calls);
        }
    }

    public static function reopeningFailures(): array
    {
        return [['open_gate'], ['start_writers']];
    }

    #[DataProvider('reopeningFailures')]
    public function test_partial_reopening_failure_closes_access_without_overwriting_new_data(string $step): void
    {
        $this->expectException(RuntimeException::class);
        try {
            $this->transaction([$step])->run();
        } finally {
            self::assertTrue($this->gateClosed);
            self::assertTrue($this->writersStopped);
            self::assertNotContains('restore_database', $this->calls);
            self::assertSame('new release', file_get_contents($this->directory.'/app'));
        }
    }

    public function test_preflight_failure_does_not_change_the_running_site(): void
    {
        $this->expectException(RuntimeException::class);
        try {
            $this->transaction(['preflight'])->run();
        } finally {
            self::assertSame(['preflight'], $this->calls);
            self::assertFalse($this->gateClosed);
            self::assertFalse($this->writersStopped);
        }
    }

    public function test_journal_failure_during_reopening_still_closes_gate(): void
    {
        $operations = $this->operations();
        $record = function (string $event, array $details): void {
            if ($event === 'finished' && ($details['operation'] ?? '') === 'open_gate') {
                throw new RuntimeException('Disk full');
            }
        };
        $this->expectException(RuntimeException::class);
        try {
            (new ReleaseTransaction($operations, $record))->run();
        } finally {
            self::assertTrue($this->gateClosed);
            self::assertTrue($this->writersStopped);
            self::assertNotContains('restore_database', $this->calls);
        }
    }

    private function transaction(array $failures = []): ReleaseTransaction
    {
        return new ReleaseTransaction($this->operations($failures), static function (): void {});
    }

    private function operations(array $failures = []): array
    {
        $operations = [];
        foreach (ReleaseTransaction::REQUIRED as $operation) {
            $operations[$operation] = function () use ($operation, $failures): void {
                $this->calls[] = $operation;
                switch ($operation) {
                    case 'close_gate': $this->gateClosed = true;
                        break;
                    case 'stop_writers': $this->writersStopped = true;
                        break;
                    case 'verify_quiescent':
                        self::assertTrue($this->gateClosed && $this->writersStopped);
                        break;
                    case 'snapshot':
                        copy($this->directory.'/app', $this->directory.'/app.backup');
                        copy($this->directory.'/database.sqlite', $this->directory.'/database.backup');
                        break;
                    case 'verify_snapshot':
                        self::assertSame(hash_file('sha256', $this->directory.'/database.sqlite'), hash_file('sha256', $this->directory.'/database.backup'));
                        break;
                    case 'migrate':
                        // Deliberately alter schema AND existing data before the fault.
                        $this->db()->exec('CREATE TABLE payment_attempts (id INTEGER); UPDATE orders SET total=999');
                        break;
                    case 'install_files': file_put_contents($this->directory.'/app', 'new release');
                        break;
                    case 'verify_release':
                        self::assertTrue($this->gateClosed && $this->writersStopped);
                        self::assertSame('new release', file_get_contents($this->directory.'/app'));
                        self::assertTrue($this->hasNewTable());
                        break;
                    case 'restore_files': copy($this->directory.'/app.backup', $this->directory.'/app');
                        break;
                    case 'restore_database': copy($this->directory.'/database.backup', $this->directory.'/database.sqlite');
                        break;
                    case 'verify_restored':
                        self::assertTrue($this->gateClosed && $this->writersStopped);
                        self::assertSame('old release', file_get_contents($this->directory.'/app'));
                        self::assertFalse($this->hasNewTable());
                        self::assertSame(125, (int) $this->db()->query('SELECT total FROM orders')->fetchColumn());
                        break;
                    case 'open_gate': $this->gateClosed = false;
                        break;
                    case 'start_writers': $this->writersStopped = false;
                        break;
                }
                if (in_array($operation, $failures, true)) {
                    throw new RuntimeException('Injected failure: '.$operation);
                }
            };
        }

        return $operations;
    }

    private function db(): PDO
    {
        return new PDO('sqlite:'.$this->directory.'/database.sqlite', options: [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    }

    private function hasNewTable(): bool
    {
        return (bool) $this->db()->query("SELECT name FROM sqlite_master WHERE name='payment_attempts'")->fetchColumn();
    }
}
