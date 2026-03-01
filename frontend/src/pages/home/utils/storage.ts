import type { SortMode } from '../types';
import { STORAGE_KEYS } from '../types';

function safeJsonParse<T>(value: string | null): T | undefined {
    if (!value) return undefined;
    try {
        return JSON.parse(value) as T;
    } catch {
        return undefined;
    }
}

export function readPinnedProjectIds(): string[] {
    const parsed = safeJsonParse<unknown>(localStorage.getItem(STORAGE_KEYS.pinned));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === 'string');
}

export function writePinnedProjectIds(ids: string[]) {
    try {
        localStorage.setItem(STORAGE_KEYS.pinned, JSON.stringify(ids));
    } catch {
        // ignore
    }
}

export function readSortMode(): SortMode {
    const raw = localStorage.getItem(STORAGE_KEYS.sortMode);
    return raw === 'alphabetical' || raw === 'lastUsed' ? raw : 'lastUsed';
}

export function writeSortMode(mode: SortMode) {
    try {
        localStorage.setItem(STORAGE_KEYS.sortMode, mode);
    } catch {
        // ignore
    }
}
