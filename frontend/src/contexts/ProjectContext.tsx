import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/api/api';
import { ProjectDetailsResponse } from '@/api/dto/filesystem';

interface ProjectContextType {
    projectName: string | null;
    projectId: string | null;
    isLoading: boolean;
    refreshProject: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType>({
    projectName: null,
    projectId: null,
    isLoading: false,
    refreshProject: async () => {},
});

export const useProject = () => useContext(ProjectContext);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { projectId } = useParams<{ projectId: string }>();
    const [projectName, setProjectName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const refreshProject = useCallback(async () => {
        if (!projectId) {
            setProjectName(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const project = await api.get<ProjectDetailsResponse>(`/api/project/${projectId}`);
            setProjectName(project.name);
        } catch (error) {
            console.error('Failed to fetch project details:', error);
            setProjectName(null);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        void refreshProject();
    }, [refreshProject]);

    return (
        <ProjectContext.Provider value={{ projectName, projectId: projectId || null, isLoading, refreshProject }}>
            {children}
        </ProjectContext.Provider>
    );
};
