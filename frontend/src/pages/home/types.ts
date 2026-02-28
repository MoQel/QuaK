export type SortMode = 'lastUsed' | 'alphabetical';

export const STORAGE_KEYS = {
    pinned: 'quak.home.pinnedProjectIds',
    sortMode: 'quak.home.projectSortMode',
} as const;
