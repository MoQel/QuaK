import React, { createContext, useCallback, useContext, useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/api/api';
import { ProjectDetailsResponse } from '@/api/dto/filesystem';
import { CircuitResponse } from '@/api/dto/circuit';

interface ProjectContextType {
    projectName: string | null;
    projectId: string | null;
    circuit: CircuitResponse | undefined;
    setCircuit: React.Dispatch<React.SetStateAction<CircuitResponse | undefined>>;
    isLoadingProject: boolean;
    isLoadingCircuit: boolean;
    refreshProject: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType>({
    projectName: null,
    projectId: null,
    circuit: undefined,
    setCircuit: () => {},
    isLoadingProject: false,
    isLoadingCircuit: false,
    refreshProject: async () => {},
});

export const useProject = () => useContext(ProjectContext);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { projectId } = useParams<{ projectId: string }>();
    const [projectName, setProjectName] = useState<string | null>(null);
    const [circuit, setCircuit] = useState<CircuitResponse | undefined>(undefined);
    const [isLoadingProject, setIsLoadingProject] = useState(false);
    const [isLoadingCircuit, setIsLoadingCircuit] = useState(false);

    const refreshProject = useCallback(async () => {
        if (!projectId) {
            setProjectName(null);
            setCircuit(undefined);
            setIsLoadingProject(false);
            setIsLoadingCircuit(false);
            return;
        }

        const currentProjectId = projectId;

        // Fetch project details
        const fetchProject = async () => {
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
        };

        // Fetch circuit details
        const fetchCircuit = async () => {
            setIsLoadingCircuit(true);
            try {
                const circuitData = await api.get<CircuitResponse>(`/api/circuit/${currentProjectId}`);
                if (currentProjectId === projectId) {
                    setCircuit(circuitData);
                }
            } catch (error) {
                console.error('Failed to fetch circuit:', error);
                if (currentProjectId === projectId) {
                    setCircuit(undefined);
                }
            } finally {
                if (currentProjectId === projectId) {
                    setIsLoadingCircuit(false);
                }
            }
        };

        await Promise.all([fetchProject(), fetchCircuit()]);
    }, [projectId]);

    useEffect(() => {
        refreshProject();
    }, [refreshProject]);

    const contextValue = useMemo(
        () => ({
            projectName,
            projectId: projectId || null,
            circuit,
            setCircuit,
            isLoadingProject,
            isLoadingCircuit,
            refreshProject,
        }),
        [projectName, projectId, circuit, isLoadingProject, isLoadingCircuit, refreshProject],
    );

    return <ProjectContext.Provider value={contextValue}>{children}</ProjectContext.Provider>;
};
