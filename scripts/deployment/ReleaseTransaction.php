<?php

declare(strict_types=1);

namespace Ellena\Deployment;

use RuntimeException;
use Throwable;

/**
 * Coordinates reviewed host operations. Operations must throw on failure.
 * The maintenance gate must be independent of the application being replaced.
 */
final class ReleaseTransaction
{
    public const REQUIRED = [
        'preflight', 'close_gate', 'stop_writers', 'verify_quiescent',
        'snapshot', 'verify_snapshot', 'migrate', 'install_files', 'rebuild_caches',
        'verify_release', 'restore_files', 'restore_database', 'verify_restored',
        'open_gate', 'start_writers',
    ];

    private bool $mutated = false;

    private bool $opening = false;

    /** @param array<string, callable(): void> $operations */
    public function __construct(private array $operations, private \Closure $record)
    {
        foreach (self::REQUIRED as $operation) {
            if (! isset($operations[$operation]) || ! is_callable($operations[$operation])) {
                throw new RuntimeException("Missing release operation: {$operation}");
            }
        }
    }

    public function run(): string
    {
        // A failed preflight must not touch the serving application.
        $this->step('preflight');

        try {
            $this->step('close_gate');
            $this->step('stop_writers');
            $this->step('verify_quiescent');
            $this->step('snapshot');
            $this->step('verify_snapshot');
            // Set before the first mutation, including a partially failed migration.
            $this->mutated = true;
            $this->step('migrate');
            $this->step('install_files');
            $this->step('rebuild_caches');
            $this->step('verify_release');
        } catch (Throwable $failure) {
            ($this->record)('release_failed', ['message' => $failure->getMessage()]);

            return $this->recover($failure);
        }

        // No schema, files or caches change after this point. Never restore a
        // stale snapshot once requests may have been admitted.
        $this->reopen();

        return 'deployed';
    }

    private function recover(Throwable $original): string
    {
        try {
            $this->step('close_gate');
            $this->step('stop_writers');
            $this->step('verify_quiescent');
        } catch (Throwable $failure) {
            $this->halt('Could not establish a closed, write-free recovery window', $failure);
        }

        if ($this->mutated) {
            $failures = [];
            // Attempt BOTH restores. Failure of either is never permission to open.
            foreach (['restore_files', 'restore_database'] as $operation) {
                try {
                    $this->step($operation);
                } catch (Throwable $failure) {
                    $failures[] = $failure->getMessage();
                }
            }
            if ($failures !== []) {
                $this->halt('Recovery incomplete: '.implode('; ', $failures), $original);
            }
        }

        try {
            $this->step('verify_restored');
        } catch (Throwable $failure) {
            $this->halt('Restored application verification failed', $failure);
        }

        $this->reopen();

        return 'rolled_back';
    }

    private function reopen(): void
    {
        $this->opening = true;
        try {
            $this->step('open_gate');
            $this->step('start_writers');
        } catch (Throwable $failure) {
            // Requests or workers might already have written new data. Close
            // access and stop workers, but NEVER overwrite it with a snapshot.
            $errors = [];
            foreach (['close_gate', 'stop_writers'] as $operation) {
                try {
                    // Emergency containment must still run if journal storage failed.
                    ($this->operations[$operation])();
                } catch (Throwable $cleanupFailure) {
                    $errors[] = $cleanupFailure->getMessage();
                }
            }
            $this->halt('Reopening failed; manual verification required'.($errors ? ': '.implode('; ', $errors) : ''), $failure);
        }
    }

    private function step(string $operation): void
    {
        ($this->record)('started', ['operation' => $operation]);
        ($this->operations[$operation])();
        ($this->record)('finished', ['operation' => $operation]);
    }

    private function halt(string $message, Throwable $cause): never
    {
        ($this->record)('halted', ['message' => $message, 'reopening_started' => $this->opening]);
        throw new RuntimeException($message.'; do not reopen automatically.', 0, $cause);
    }
}
