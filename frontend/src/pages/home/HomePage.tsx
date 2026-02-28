import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Plus, Users } from 'lucide-react';

import { Button } from '@/components/ui/button.tsx';
import { useProjectActionsDialog } from '@/components/projects/useProjectActionsDialog.tsx';

import { api } from '@/api/api.ts';
import type { ProjectDetailsResponse } from '@/api/dto/filesystem.ts';
import { CreateProject } from '@/views/project-manager-view/ProjectManagerView.tsx';

import type { SortMode } from './types';
import { readPinnedProjectIds, readSortMode, writePinnedProjectIds, writeSortMode } from './utils/storage';
import { LoadingState } from './components/LoadingState';
import { ProjectCard } from './components/ProjectCard';
import { ProjectSection } from './components/ProjectSection';
import { SortSelect } from './components/SortSelect';

export function HomePage() {
    const [ownProjects, setOwnProjects] = useState<ProjectDetailsResponse[]>([]);
    const [invitedProjects, setInvitedProjects] = useState<ProjectDetailsResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [pinnedProjectIds, setPinnedProjectIds] = useState<string[]>(() => readPinnedProjectIds());
    const [sortMode, setSortMode] = useState<SortMode>(() => readSortMode());

    const { dialog, openRenameProjectDialog, openDeleteProjectDialog } = useProjectActionsDialog();

    const navigate = useNavigate();

    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            const projects = await api.get<ProjectDetailsResponse[]>('/api/project/');
            // For now, we put all projects in "Own Projects" as the API doesn't distinguish yet
            setOwnProjects(projects);
            setInvitedProjects([]);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        writePinnedProjectIds(pinnedProjectIds);
    }, [pinnedProjectIds]);

    useEffect(() => {
        writeSortMode(sortMode);
    }, [sortMode]);

    const isPinned = (projectId: string) => pinnedProjectIds.includes(projectId);

    const togglePin = (projectId: string) => {
        setPinnedProjectIds((prev) => {
            if (prev.includes(projectId)) return prev.filter((id) => id !== projectId);
            return [projectId, ...prev];
        });
    };

    const handleRename = (project: ProjectDetailsResponse) => {
        openRenameProjectDialog(project, {
            onRenamed: () => fetchProjects(),
        });
    };

    const handleProjectDeleted = (projectId: string) => {
        setPinnedProjectIds((prev) => prev.filter((id) => id !== projectId));
        return fetchProjects();
    };

    const handleDelete = (project: ProjectDetailsResponse) => {
        openDeleteProjectDialog(project, {
            onDeleted: () => handleProjectDeleted(project.id),
        });
    };

    const displayedOwnProjects = useMemo(() => {
        const byId = new Map(ownProjects.map((p) => [p.id, p] as const));
        const pinned = pinnedProjectIds.map((id) => byId.get(id)).filter((p): p is ProjectDetailsResponse => !!p);
        const pinnedSet = new Set(pinned.map((p) => p.id));

        const rest = ownProjects.filter((p) => !pinnedSet.has(p.id));
        const sortedRest = [...rest].sort((a, b) => {
            if (sortMode === 'alphabetical') {
                return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
            }
            return new Date(b.lastAccess).getTime() - new Date(a.lastAccess).getTime();
        });

        return [...pinned, ...sortedRest];
    }, [ownProjects, pinnedProjectIds, sortMode]);

    const handleProjectCreated = (project: ProjectDetailsResponse) => {
        navigate(`/project/${project.id}`);
    };

    let ownProjectsContent;
    if (isLoading) {
        ownProjectsContent = <LoadingState />;
    } else if (displayedOwnProjects.length > 0) {
        ownProjectsContent = (
            <div className="overflow-x-auto pb-4 -mx-2 px-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                <div className="flex flex-row gap-4">
                    {displayedOwnProjects.map((p) => (
                        <ProjectCard
                            key={p.id}
                            project={p}
                            pinned={isPinned(p.id)}
                            onRename={handleRename}
                            onDelete={handleDelete}
                            onTogglePin={togglePin}
                        />
                    ))}
                </div>
            </div>
        );
    } else {
        ownProjectsContent = (
            <div className="text-center py-12">
                <FolderOpen className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <p className="text-sm text-text-muted">You have no projects yet.</p>
                <CreateProject onSuccess={handleProjectCreated} reload={fetchProjects}>
                    <Button className="mt-4" variant="outline">
                        Create New Project
                    </Button>
                </CreateProject>
            </div>
        );
    }

    let invitedProjectsContent;
    if (isLoading) {
        invitedProjectsContent = <LoadingState />;
    } else if (invitedProjects.length > 0) {
        invitedProjectsContent = (
            <div className="overflow-x-auto pb-4 -mx-2 px-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                <div className="flex flex-row gap-4">
                    {invitedProjects.map((p) => (
                        <ProjectCard
                            key={p.id}
                            project={p}
                            pinned={isPinned(p.id)}
                            onRename={handleRename}
                            onDelete={handleDelete}
                            onTogglePin={togglePin}
                        />
                    ))}
                </div>
            </div>
        );
    } else {
        invitedProjectsContent = (
            <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">You have no invited projects.</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
            {dialog}

            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2 text-text leading-tight py-1">Projects</h1>
                <p className="text-base text-text-muted">
                    Welcome to your quantum computing workspace. View and manage all your projects.
                </p>
            </div>

            <div className="space-y-6">
                <ProjectSection
                    title="Own Projects"
                    description="Projects you created and own"
                    icon={
                        <div className="w-14 h-14 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <FolderOpen className="w-5 h-5 text-blue-500" />
                        </div>
                    }
                    headerActions={
                        <>
                            <SortSelect value={sortMode} onChange={setSortMode} />
                            <CreateProject onSuccess={handleProjectCreated} reload={fetchProjects}>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Plus className="size-4" />
                                    New Project
                                </Button>
                            </CreateProject>
                        </>
                    }
                >
                    {ownProjectsContent}
                </ProjectSection>

                <ProjectSection
                    title="Invited Projects"
                    description="Projects shared with you by collaborators"
                    icon={
                        <div className="w-14 h-14 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-purple-500" />
                        </div>
                    }
                >
                    {invitedProjectsContent}
                </ProjectSection>
            </div>
        </div>
    );
}

export default HomePage;
