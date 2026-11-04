import { Check, ChevronDown, LayoutGrid, Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '@/api/api.ts';
import type { ProjectDetailsResponse } from '@/api/dto/filesystem.ts';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { readPinnedProjectIds } from '@/pages/home/utils/storage.ts';
import { safeLeaveProject } from '@/store/tabs/tabsThunks.ts';

const MAX_LISTED_PROJECTS = 8;

interface ProjectSwitcherProps {
    projectId: string;
    projectName: string;
    onNewProject: () => void;
}

export function ProjectSwitcher({ projectId, projectName, onNewProject }: Readonly<ProjectSwitcherProps>) {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [open, setOpen] = useState(false);
    const [projects, setProjects] = useState<ProjectDetailsResponse[]>([]);
    const itemSelectedRef = useRef(false);

    useEffect(() => {
        if (!open) return;
        api.get<ProjectDetailsResponse[]>('/api/project/')
            .then(setProjects)
            .catch((error) => console.error('Failed to fetch projects:', error));
    }, [open]);

    const listed = useMemo(() => {
        const pinnedIds = readPinnedProjectIds();
        const rank = (p: ProjectDetailsResponse) => (pinnedIds.includes(p.id) ? 0 : 1);
        return [...projects]
            .sort((a, b) => rank(a) - rank(b) || new Date(b.lastAccess).getTime() - new Date(a.lastAccess).getTime())
            .slice(0, MAX_LISTED_PROJECTS);
    }, [projects]);

    const leaveTo = (target: string) => dispatch(safeLeaveProject(target, navigate));

    const selectItem = (action: () => void) => {
        itemSelectedRef.current = true;
        action();
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label="Switch project"
                    title={projectName}
                    className="flex min-w-0 items-center gap-1 rounded-md px-1.5 py-1 text-sm font-semibold outline-none hover:bg-bg-light focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                    <span className="min-w-0 truncate">{projectName}</span>
                    <ChevronDown className="size-3.5 shrink-0 text-text-muted" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="start"
                className="w-64 text-left"
                onCloseAutoFocus={(event) => {
                    if (itemSelectedRef.current) event.preventDefault();
                    itemSelectedRef.current = false;
                }}
            >
                <div className="px-2 py-1.5 text-xs font-medium text-text-muted">Projects</div>
                {listed.map((p) => (
                    <DropdownMenuItem
                        key={p.id}
                        onSelect={() => selectItem(() => p.id !== projectId && leaveTo(`/project/${p.id}`))}
                    >
                        <span className="min-w-0 flex-1 truncate">{p.name}</span>
                        {p.id === projectId && <Check />}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => selectItem(onNewProject)}>
                    <Plus /> New project
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => selectItem(() => leaveTo('/'))}>
                    <LayoutGrid /> All projects
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
