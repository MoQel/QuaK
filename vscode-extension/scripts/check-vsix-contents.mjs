import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Checks the same VSIX produced by the package script, catching accidental
// publication of workspace files through monorepo dependency symlinks.

const vsix = join(mkdtempSync(join(tmpdir(), 'quak-vsix-')), 'quak.vsix');
execFileSync('npm', ['run', 'package', '--silent', '--', '-o', vsix], { stdio: 'inherit' });

const entries = execFileSync('unzip', ['-Z1', vsix], { encoding: 'utf8' })
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean);

const secrets = entries.filter((entry) => /(^|\/)\.(env|git)(\/|$)/.test(entry));
const sources = entries.filter((entry) => entry.endsWith('.ts') || entry.endsWith('.map'));
const tests = entries.filter((entry) => entry.includes('/test/'));

const problems = [
    ['files that must never be published', secrets],
    ['sources and sourcemaps', sources],
    ['tests', tests],
].filter(([, found]) => found.length > 0);

if (problems.length > 0) {
    for (const [what, found] of problems) {
        console.error(`vsix contains ${what}:`);
        console.error(
            found
                .slice(0, 10)
                .map((entry) => `  ${entry}`)
                .join('\n'),
        );
    }
    process.exit(1);
}

console.log(`vsix: ${entries.length} entries, no secrets, sources or tests`);
