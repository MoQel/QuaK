import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.tsx';
import { FolderOpen, Users, Plus } from 'lucide-react';
import { api } from '@/api/api.ts';
import { ProjectDetailsResponse } from '@/api/dto/filesystem.ts';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { CreateProject } from '@/views/project-manager-view/ProjectManagerView.tsx';

export const Home: React.FC = () => {
    const [ownProjects, setOwnProjects] = useState<ProjectDetailsResponse[]>([]);
    const [invitedProjects, setInvitedProjects] = useState<ProjectDetailsResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const fetchProjects = async () => {
        try {
            const projects = await api.get<ProjectDetailsResponse[]>('/api/project/');
            // For now, we put all projects in "Own Projects" as the API doesn't distinguish yet
            setOwnProjects(projects);
            setInvitedProjects([]); // Keep empty for now
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleProjectCreated = (project: ProjectDetailsResponse) => {
        navigate(`/project/${project.id}`);
    };

    const ProjectCard: React.FC<{ project: ProjectDetailsResponse }> = ({ project }) => (
        <Card className="min-w-[16rem] flex-shrink-0 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center">
                            <FolderOpen className="w-5 h-5 text-white" />
                        </div>
                        <div className="font-medium text-lg flex-1 truncate" title={project.name}>
                            {project.name}
                        </div>
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

    const LoadingState = () => (
        <div className="flex flex-row gap-4 overflow-x-auto pb-4">
            {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="min-w-[16rem] h-[180px] rounded-xl" />
            ))}
        </div>
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
            <div className="mb-9">
                <h1 className="text-4xl font-bold mb-5 text-text leading-tight py-1">Projects</h1>
                <p className="text-lg text-text-muted">
                    Welcome to your quantum computing workspace. View and manage all your projects.
                </p>
            </div>

            <div className="space-y-6">
                {/* Own Projects Section */}
                <Card className="border-2">
                    <CardHeader>
                        <div className="flex items-start gap-3">
                            <div className="w-14 h-14 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <FolderOpen className="w-5 h-5 text-blue-500" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-2xl text-left">Own Projects</CardTitle>
                                <CardDescription className="text-left">Projects you created and own</CardDescription>
                            </div>
                            <CreateProject onSuccess={handleProjectCreated} reload={fetchProjects}>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Plus className="size-4" />
                                    New Project
                                </Button>
                            </CreateProject>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <LoadingState />
                        ) : ownProjects.length > 0 ? (
                            <div className="overflow-x-auto pb-4 -mx-2 px-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                                <div className="flex flex-row gap-4">
                                    {ownProjects.map((p) => (
                                        <ProjectCard key={p.id} project={p} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <FolderOpen className="w-12 h-12 text-text-muted mx-auto mb-3" />
                                <p className="text-sm text-text-muted">You have no projects yet.</p>
                                <CreateProject onSuccess={handleProjectCreated} reload={fetchProjects}>
                                    <Button className="mt-4" variant="outline">
                                        Create New Project
                                    </Button>
                                </CreateProject>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Invited Projects Section */}
                <Card className="border-2">
                    <CardHeader>
                        <div className="flex items-start gap-3">
                            <div className="w-14 h-14 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <Users className="w-5 h-5 text-purple-500" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-2xl text-left">Invited Projects</CardTitle>
                                <CardDescription className="text-left">
                                    Projects shared with you by collaborators
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <LoadingState />
                        ) : invitedProjects.length > 0 ? (
                            <div className="overflow-x-auto pb-4 -mx-2 px-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                                <div className="flex flex-row gap-4">
                                    {invitedProjects.map((p) => (
                                        <ProjectCard key={p.id} project={p} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">You have no invited projects.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Home;
