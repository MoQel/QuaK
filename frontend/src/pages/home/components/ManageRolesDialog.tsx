import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Trash2, Users, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/api/api.ts';
import type { ProjectRoleResponse, UserSearchResult } from '@/api/dto/roles.ts';
import type { ProjectDetailsResponse } from '@/api/dto/filesystem.ts';

import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import UserAvatar from '@/components/UserAvatar.tsx';

interface ManageRolesDialogProps {
    project: ProjectDetailsResponse;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ManageRolesDialog({ project, open, onOpenChange }: Readonly<ManageRolesDialogProps>) {
    const [roles, setRoles] = useState<ProjectRoleResponse[]>([]);
    const [isLoadingRoles, setIsLoadingRoles] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Fetch existing roles
    const fetchRoles = useCallback(async () => {
        setIsLoadingRoles(true);
        try {
            const data = await api.get<ProjectRoleResponse[]>(`/api/project/${project.id}/roles`);
            setRoles(data);
        } catch (err) {
            console.error('Failed to fetch roles:', err);
        } finally {
            setIsLoadingRoles(false);
        }
    }, [project.id]);

    useEffect(() => {
        if (open) {
            fetchRoles();
            setSearchQuery('');
            setSearchResults([]);
            setShowResults(false);
        }
    }, [open, fetchRoles]);

    // Debounced user search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const users = await api.get<UserSearchResult[]>(
                    `/api/users/search?email=${encodeURIComponent(searchQuery.trim())}`,
                );
                // Filter out users who already have a role in this project
                const existingUserIds = new Set(roles.map((r) => r.userId));
                const filtered = users.filter((u) => !existingUserIds.has(u.userId));
                setSearchResults(filtered);
                setShowResults(true);
            } catch (err) {
                console.error('Search failed:', err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchQuery, roles]);

    // Close search results when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInvite = async (user: UserSearchResult) => {
        try {
            await api.post(`/api/project/${project.id}/roles`, {
                userId: user.userId,
                role: 'VIEWER',
            });
            toast.success(`Invited ${user.email} as Viewer`);
            setSearchQuery('');
            setSearchResults([]);
            setShowResults(false);
            await fetchRoles();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to invite user';
            toast.error(msg);
        }
    };

    const handleRemoveRole = async (userId: string, email?: string) => {
        try {
            await api.delete(`/api/project/${project.id}/roles/${userId}`);
            toast.success(`Removed ${email || 'user'} from project`);
            await fetchRoles();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to remove user';
            toast.error(msg);
        }
    };

    const owners = roles.filter((r) => r.role === 'OWNER');
    const viewers = roles.filter((r) => r.role === 'VIEWER');

    const renderSearchResultsContent = () => {
        if (isSearching) {
            return (
                <div className="flex items-center justify-center py-4 text-text-muted">
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Searching...
                </div>
            );
        }
        if (searchResults.length > 0) {
            return searchResults.map((user) => (
                <button
                    key={user.userId}
                    onClick={() => handleInvite(user)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-bg-light transition-colors text-left"
                >
                    <UserAvatar
                        avatarUrl={user.avatarUrl}
                        alt={user.name || user.email}
                        className="w-8 h-8"
                        size="sm"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text truncate">{user.name || user.email}</div>
                        <div className="text-xs text-text-muted truncate">{user.email}</div>
                    </div>
                    <span className="text-xs text-text-muted px-2 py-0.5 rounded bg-bg-light">Invite</span>
                </button>
            ));
        }
        return <div className="py-4 text-center text-sm text-text-muted">No users found matching "{searchQuery}"</div>;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="size-5" />
                        Manage Access
                    </DialogTitle>
                    <DialogDescription>
                        Invite collaborators to <span className="font-semibold text-text">"{project.name}"</span>
                    </DialogDescription>
                </DialogHeader>

                {/* Search / Invite Section */}
                <div ref={searchRef} className="relative">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-muted" />
                        <Input
                            id="invite-search"
                            placeholder="Search by email address..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => searchResults.length > 0 && setShowResults(true)}
                            className="pl-9 pr-9"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSearchResults([]);
                                    setShowResults(false);
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>

                    {/* Search Results Dropdown */}
                    {showResults && (
                        <div className="absolute z-50 w-full mt-1 bg-bg border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {renderSearchResultsContent()}
                        </div>
                    )}
                </div>

                {/* Current Members */}
                <div className="mt-2 space-y-3">
                    <div className="text-sm font-medium text-text">Members ({roles.length})</div>

                    {isLoadingRoles ? (
                        <div className="flex items-center justify-center py-6 text-text-muted">
                            <Loader2 className="size-4 animate-spin mr-2" />
                            Loading members...
                        </div>
                    ) : (
                        <div className="space-y-1 max-h-52 overflow-y-auto rounded-lg border border-border">
                            {/* Owners */}
                            {owners.map((role) => (
                                <RoleMemberRow key={role.userId} role={role} isOwner />
                            ))}

                            {/* Viewers */}
                            {viewers.map((role) => (
                                <RoleMemberRow
                                    key={role.userId}
                                    role={role}
                                    onRemove={() => handleRemoveRole(role.userId)}
                                />
                            ))}

                            {roles.length === 0 && (
                                <div className="py-6 text-center text-sm text-text-muted">
                                    No members yet. Invite someone above!
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

/** A single row in the members list */
function RoleMemberRow({
    role,
    isOwner = false,
    onRemove,
}: Readonly<{
    role: ProjectRoleResponse;
    isOwner?: boolean;
    onRemove?: () => void;
}>) {
    const displayName = role.name || role.email || role.userId;
    const displayDetail = role.email || '';
    const hasUserInfo = !!(role.name || role.email);

    return (
        <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-bg-light/50 transition-colors">
            <UserAvatar avatarUrl={role.avatarUrl} alt={displayName} className="w-8 h-8" size="sm" />
            <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium text-text truncate ${hasUserInfo ? '' : 'font-mono text-xs'}`}>
                    {displayName}
                </div>
                {displayDetail && <div className="text-xs text-text-muted truncate">{displayDetail}</div>}
            </div>
            <Badge
                variant="outline"
                className={`text-xs ${isOwner ? 'border-amber-500/40 text-amber-600 dark:text-amber-400' : ''}`}
            >
                {isOwner ? 'Owner' : 'Viewer'}
            </Badge>
            {!isOwner && onRemove && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-text-muted hover:text-destructive-text"
                    onClick={onRemove}
                    title="Remove access"
                >
                    <Trash2 className="size-3.5" />
                </Button>
            )}
        </div>
    );
}
