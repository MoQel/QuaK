import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, MoreVertical, Pencil, Pin, PinOff, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx';
import type { ProjectDetailsResponse } from '@/api/dto/filesystem.ts';

export function ProjectCard({
    project,
    pinned,
    onRename,
    onDelete,
    onTogglePin,
}: Readonly<{
    project: ProjectDetailsResponse;
    pinned: boolean;
    onRename: (project: ProjectDetailsResponse) => void;
    onDelete: (project: ProjectDetailsResponse) => void;
    onTogglePin: (projectId: string) => void;
}>) {
    const [actionsOpen, setActionsOpen] = useState(false);

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
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="text-sm text-text-muted">
                        Last modified: {new Date(project.lastAccess).toLocaleDateString()}
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
