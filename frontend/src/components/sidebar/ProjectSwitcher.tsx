import { Check, ChevronDown, LayoutGrid, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
import { readPinnedProjectIds } from '@/pages/home/utils/storage.ts';

const MAX_LISTED_PROJECTS = 8;

interface ProjectSwitcherProps {
    projectId: string;
    projectName: string;
    onNewProject: () => void;
}

export function ProjectSwitcher({ projectId, projectName, onNewProject }: Readonly<ProjectSwitcherProps>) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [projects, setProjects] = useState<ProjectDetailsResponse[]>([]);

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

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label="Switch project"
                    title={projectName}
                    className="flex min-w-0 items-center gap-1 rounded-md px-1.5 py-1 text-sm font-semibold hover:bg-bg-light"
                >
                    <span className="min-w-0 truncate">{projectName}</span>
                    <ChevronDown className="size-3.5 shrink-0 text-text-muted" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 text-left">
                <div className="px-2 py-1.5 text-xs font-medium text-text-muted">Projects</div>
                {listed.map((p) => (
                    <DropdownMenuItem key={p.id} onSelect={() => navigate(`/project/${p.id}`)}>
                        <span className="min-w-0 flex-1 truncate">{p.name}</span>
                        {p.id === projectId && <Check />}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onNewProject}>
                    <Plus /> New project
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate('/')}>
                    <LayoutGrid /> All projects
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
