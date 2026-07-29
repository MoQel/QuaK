#!/usr/bin/env node
// Guards the one hazard of committing generated code: someone edits a .g4 and
// forgets to regenerate, so the backend's parser and the extension's silently
// disagree.
//
// Regenerating in CI would catch it too, but that needs a JDK in the js-checks
// job, which is Node-only on purpose. Hashing the grammars is Node-only and
// catches exactly this case.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const grammars = ['OpenQASM3Lexer.g4', 'OpenQASM3Parser.g4'].map((name) =>
    join(here, '..', '..', '..', 'backend', 'src', 'main', 'antlr', name),
);
const stampPath = join(here, '..', 'src', 'generated', '.grammar-hash');

const hash = createHash('sha256');
for (const path of grammars) hash.update(readFileSync(path));
const current = hash.digest('hex');

if (process.argv.includes('--write')) {
    writeFileSync(stampPath, `${current}\n`);
    console.log(`grammar hash written: ${current.slice(0, 12)}`);
    process.exit(0);
}

let recorded;
try {
    recorded = readFileSync(stampPath, 'utf8').trim();
} catch {
    console.error(
        'No .grammar-hash next to the generated parser. Run: npm run generate --workspace @quak/qasm-transform',
    );
    process.exit(1);
}

if (recorded !== current) {
    console.error(
        `The ANTLR grammars changed but the generated TypeScript parser did not.\n` +
            `  grammars: ${current.slice(0, 12)}\n` +
            `  generated from: ${recorded.slice(0, 12)}\n` +
            `Run: npm run generate --workspace @quak/qasm-transform  (needs a JDK)`,
    );
    process.exit(1);
}

console.log(`generated parser is current with the grammars (${current.slice(0, 12)})`);
