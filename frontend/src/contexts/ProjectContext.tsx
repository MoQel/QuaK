import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/api/api';
import { ProjectDetailsResponse } from '@/api/dto/filesystem';

interface ProjectContextType {
    projectName: string | null;
    projectId: string | null;
    isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType>({
    projectName: null,
    projectId: null,
    isLoading: false,
});

export const useProject = () => useContext(ProjectContext);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { projectId } = useParams<{ projectId: string }>();
    const [projectName, setProjectName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (projectId) {
            setIsLoading(true);
            api.get<ProjectDetailsResponse>(`/api/project/${projectId}`)
                .then((project) => {
                    setProjectName(project.name);
                })
                .catch((error) => {
                    console.error('Failed to fetch project details:', error);
                    setProjectName(null);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setProjectName(null);
            setIsLoading(false);
        }
    }, [projectId]);

    return (
        <ProjectContext.Provider value={{ projectName, projectId: projectId || null, isLoading }}>
            {children}
        </ProjectContext.Provider>
    );
};
