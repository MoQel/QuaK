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
    isLoading: boolean;
    refreshProject: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType>({
    projectName: null,
    projectId: null,
    circuit: undefined,
    setCircuit: () => {},
    isLoading: false,
    refreshProject: async () => {},
});

export const useProject = () => useContext(ProjectContext);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { projectId } = useParams<{ projectId: string }>();
    const [projectName, setProjectName] = useState<string | null>(null);
    const [circuit, setCircuit] = useState<CircuitResponse | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);

    const refreshProject = useCallback(async () => {
        if (!projectId) {
            setProjectName(null);
            setCircuit(undefined);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            // Fetch project and circuit in parallel
            const [project, circuitData] = await Promise.all([
                api.get<ProjectDetailsResponse>(`/api/project/${projectId}`),
                api.get<CircuitResponse>(`/api/circuit/${projectId}`),
            ]);

            setProjectName(project.name);
            setCircuit(circuitData);
        } catch (error) {
            console.error('Failed to fetch project details or circuit:', error);
            setProjectName(null);
            setCircuit(undefined);
        } finally {
            setIsLoading(false);
        }
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
            isLoading,
            refreshProject,
        }),
        [projectName, projectId, circuit, isLoading, refreshProject],
    );

    return <ProjectContext.Provider value={contextValue}>{children}</ProjectContext.Provider>;
};
