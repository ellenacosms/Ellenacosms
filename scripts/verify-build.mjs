import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const publicDirectory = resolve('public');
const manifestPath = resolve(publicDirectory, 'build/manifest.json');

if (!existsSync(manifestPath)) {
    throw new Error(
        'Vite manifest is missing. Run `npm run build` before deployment.',
    );
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const missing = new Set();

for (const entry of Object.values(manifest)) {
    const files = [
        entry.file,
        ...(entry.css ?? []),
        ...(entry.assets ?? []),
    ].filter(Boolean);

    for (const file of files) {
        if (!existsSync(resolve(publicDirectory, 'build', file))) {
            missing.add(file);
        }
    }
}

if (missing.size > 0) {
    throw new Error(
        `Vite manifest references missing deployment assets:\n${[...missing].join('\n')}`,
    );
}

const entryCount = Object.keys(manifest).length;

if (entryCount === 0) {
    throw new Error('Vite manifest contains no application entries.');
}

console.log(`Verified ${entryCount} Vite manifest entries and their assets.`);
