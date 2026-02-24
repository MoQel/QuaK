import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, MoreVertical, Pencil, Pin, PinOff, Trash2, Users } from 'lucide-react';

import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip.tsx';
import type { ProjectDetailsResponse } from '@/api/dto/filesystem.ts';
import UserAvatar from '@/components/UserAvatar.tsx';

export function ProjectCard({
    project,
    pinned,
    onRename,
    onDelete,
    onTogglePin,
    onManageAccess,
    isOwner = true,
}: {
    project: ProjectDetailsResponse;
    pinned: boolean;
    onRename: (project: ProjectDetailsResponse) => void;
    onDelete: (project: ProjectDetailsResponse) => void;
    onTogglePin: (projectId: string) => void;
    onManageAccess?: (project: ProjectDetailsResponse) => void;
    isOwner?: boolean;
}) {
    const [actionsOpen, setActionsOpen] = useState(false);

    const owner = project.owner;

    return (
        <Card className="min-w-[16rem] flex-shrink-0 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center">
                            <FolderOpen className="w-5 h-5 text-white" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <div className="font-medium text-lg truncate" title={project.name}>
                                    {project.name}
                                </div>
                                {pinned ? <Pin className="size-4 text-text-muted" aria-label="Pinned" /> : null}
                            </div>
                        </div>

                        <Popover open={actionsOpen} onOpenChange={setActionsOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label="Project actions">
                                    <MoreVertical className="size-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2">
                                <div className="flex flex-col gap-1">
                                    {isOwner && (
                                        <Button
                                            variant="ghost"
                                            className="justify-start hover:bg-bg-light"
                                            onClick={() => {
                                                setActionsOpen(false);
                                                onRename(project);
                                            }}
                                        >
                                            <Pencil className="size-4" />
                                            Rename
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        className="justify-start hover:bg-bg-light"
                                        onClick={() => {
                                            setActionsOpen(false);
                                            onTogglePin(project.id);
                                        }}
                                    >
                                        {pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                                        {pinned ? 'Unpin' : 'Pin'}
                                    </Button>
                                    {isOwner && onManageAccess && (
                                        <Button
                                            variant="ghost"
                                            className="justify-start hover:bg-bg-light"
                                            onClick={() => {
                                                setActionsOpen(false);
                                                onManageAccess(project);
                                            }}
                                        >
                                            <Users className="size-4" />
                                            Manage Access
                                        </Button>
                                    )}
                                    {isOwner && (
                                        <>
                                            <div className="h-px bg-border my-1" />
                                            <Button
                                                variant="destructive"
                                                className="justify-start"
                                                onClick={() => {
                                                    setActionsOpen(false);
                                                    onDelete(project);
                                                }}
                                            >
                                                <Trash2 className="size-4" />
                                                Delete
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Metadata Footer */}
                    <div className="flex items-center justify-between pt-3 mt-1 border-t border-border/40">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] uppercase font-bold tracking-tight text-text-muted/50">
                                Modified
                            </span>
                            <span className="text-xs font-medium text-text-muted">
                                {new Date(project.lastAccess).toLocaleDateString()}
                            </span>
                        </div>

                        {!isOwner && owner && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex flex-col items-end gap-0.5 group cursor-help">
                                            <span className="text-[10px] uppercase font-bold tracking-tight text-text-muted/50 group-hover:text-purple-500 transition-colors">
                                                Owner
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-text-muted truncate max-w-[90px]">
                                                    {owner.name?.split(' ')[0] ?? owner.email}
                                                </span>
                                                <UserAvatar
                                                    avatarUrl={owner.avatarUrl}
                                                    alt={owner.name ?? owner.email}
                                                    size="sm"
                                                    className="w-5 h-5 ring-1 ring-border shadow-sm border border-background"
                                                />
                                            </div>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-xs">
                                        <div className="flex flex-col gap-1">
                                            <p className="font-semibold">{owner.name ?? owner.email}</p>
                                            {owner.name && <p className="text-text-muted">{owner.email}</p>}
                                            <div className="h-px bg-border my-0.5" />
                                            <p className="flex items-center gap-1 text-purple-500 font-medium">
                                                <Users className="size-3" />
                                                Project owner
                                            </p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                    <div className="mt-2">
                        <Link to={`/project/${project.id}`}>
                            <Button className="w-full" variant="default">
                                Open Project
                            </Button>
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
