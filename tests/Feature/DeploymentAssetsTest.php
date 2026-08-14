<?php

namespace Tests\Feature;

use Tests\TestCase;

class DeploymentAssetsTest extends TestCase
{
    public function test_vite_manifest_references_existing_public_assets(): void
    {
        $manifestPath = public_path('build/manifest.json');

        $this->assertFileExists($manifestPath);

        /** @var array<string, array{file?: string, css?: list<string>, assets?: list<string>}> $manifest */
        $manifest = json_decode((string) file_get_contents($manifestPath), true, flags: JSON_THROW_ON_ERROR);

        $this->assertNotEmpty($manifest);

        foreach ($manifest as $entry) {
            $files = array_filter([
                $entry['file'] ?? null,
                ...($entry['css'] ?? []),
                ...($entry['assets'] ?? []),
            ]);

            foreach ($files as $file) {
                $this->assertFileExists(public_path('build/'.$file));
            }
        }
    }
}
