import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/api/api.ts';
import type { DirectoryContentsResponse, FileElementDto } from '@/api/dto/filesystem.ts';
import { collectProjectFiles } from './subcircuits.ts';

vi.mock('@/api/api.ts', () => ({ api: { get: vi.fn() } }));

const element = (id: string, type: 'file' | 'directory'): FileElementDto => ({
    id,
    name: id,
    type,
    createdOn: '2026-01-01T00:00:00Z',
    lastAccess: '2026-01-01T00:00:00Z',
});

const directories: Record<string, FileElementDto[]> = {
    src: [element('a.qasm', 'file'), element('nested', 'directory'), element('b.qasm', 'file')],
    nested: [element('c.qasm', 'file')],
    empty: [],
};

beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.get).mockImplementation((url: string) => {
        const id = url.replace('/api/directory/', '');
        const directory: DirectoryContentsResponse = { ...element(id, 'directory'), contents: directories[id] };
        return Promise.resolve(directory);
    });
});

describe('collectProjectFiles', () => {
    it('flattens nested directories, keeping the tree order', async () => {
        const files = await collectProjectFiles([
            element('main.qasm', 'file'),
            element('src', 'directory'),
            element('last.qasm', 'file'),
        ]);

        expect(files.map((file) => file.id)).toEqual(['main.qasm', 'a.qasm', 'c.qasm', 'b.qasm', 'last.qasm']);
    });

    it('fetches each directory once and skips what is neither a file nor a directory', async () => {
        const files = await collectProjectFiles([
            element('empty', 'directory'),
            { ...element('p', 'file'), type: 'project' },
        ]);

        expect(files).toEqual([]);
        expect(api.get).toHaveBeenCalledTimes(1);
        expect(api.get).toHaveBeenCalledWith('/api/directory/empty');
    });
});
