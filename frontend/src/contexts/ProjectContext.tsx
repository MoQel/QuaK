import React, { createContext, useCallback, useContext, useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/api/api';
import { ProjectDetailsResponse } from '@/api/dto/filesystem';

interface ProjectContextType {
    projectName: string | null;
    projectId: string | null;
    isLoadingProject: boolean;
    refreshProject: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType>({
    projectName: null,
    projectId: null,
    isLoadingProject: false,
    refreshProject: async () => {},
});

export const useProject = () => useContext(ProjectContext);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { projectId } = useParams<{ projectId: string }>();
    const [projectName, setProjectName] = useState<string | null>(null);
    const [isLoadingProject, setIsLoadingProject] = useState(false);

    const refreshProject = useCallback(async () => {
        if (!projectId) {
            setProjectName(null);
            setIsLoadingProject(false);
            return;
        }

        const currentProjectId = projectId;

        setIsLoadingProject(true);
        try {
            const project = await api.get<ProjectDetailsResponse>(`/api/project/${currentProjectId}`);
            if (currentProjectId === projectId) {
                setProjectName(project.name);
            }
        } catch (error) {
            console.error('Failed to fetch project details:', error);
            if (currentProjectId === projectId) {
                setProjectName(null);
            }
        } finally {
            if (currentProjectId === projectId) {
                setIsLoadingProject(false);
            }
        }
    }, [projectId]);

    useEffect(() => {
        refreshProject();
    }, [refreshProject]);

    const contextValue = useMemo(
        () => ({
            projectName,
            projectId: projectId || null,
            isLoadingProject,
            refreshProject,
        }),
        [projectName, projectId, isLoadingProject, refreshProject],
    );

    return <ProjectContext.Provider value={contextValue}>{children}</ProjectContext.Provider>;
};
