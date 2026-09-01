import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Checks the same VSIX produced by the package script, catching accidental
// publication of workspace files through monorepo dependency symlinks.

const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const CENTRAL_DIRECTORY_HEADER_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_SIZE = 22;
const CENTRAL_DIRECTORY_HEADER_SIZE = 46;

const npmCli = process.env.npm_execpath;

if (!npmCli) {
    console.error('No npm_execpath in the environment. Run this through npm: npm run check:vsix');
    process.exit(1);
}

const vsix = join(mkdtempSync(join(tmpdir(), 'quak-vsix-')), 'quak.vsix');
execFileSync(process.execPath, [npmCli, 'run', 'package', '--silent', '--', '-o', vsix], { stdio: 'inherit' });

const entries = listZipEntries(vsix);

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

function listZipEntries(path) {
    const zip = readFileSync(path);
    const endOfCentralDirectory = findEndOfCentralDirectory(zip, path);
    const total = zip.readUInt16LE(endOfCentralDirectory + 10);
    const names = [];
    let offset = zip.readUInt32LE(endOfCentralDirectory + 16);

    for (let entry = 0; entry < total; entry++) {
        if (zip.readUInt32LE(offset) !== CENTRAL_DIRECTORY_HEADER_SIGNATURE) {
            throw new Error(`${path}: central directory entry ${entry} is malformed`);
        }

        const nameLength = zip.readUInt16LE(offset + 28);
        const extraLength = zip.readUInt16LE(offset + 30);
        const commentLength = zip.readUInt16LE(offset + 32);

        names.push(
            zip.toString(
                'utf8',
                offset + CENTRAL_DIRECTORY_HEADER_SIZE,
                offset + CENTRAL_DIRECTORY_HEADER_SIZE + nameLength,
            ),
        );
        offset += CENTRAL_DIRECTORY_HEADER_SIZE + nameLength + extraLength + commentLength;
    }

    return names;
}

function findEndOfCentralDirectory(zip, path) {
    for (let offset = zip.length - END_OF_CENTRAL_DIRECTORY_SIZE; offset >= 0; offset--) {
        if (zip.readUInt32LE(offset) === END_OF_CENTRAL_DIRECTORY_SIGNATURE) return offset;
    }

    throw new Error(`${path}: no zip end of central directory record`);
}
