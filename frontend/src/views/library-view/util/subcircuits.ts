import { useCallback, useEffect, useState } from 'react';
import { api } from '@/api/api.ts';
import { CircuitResponse } from '@/api/dto/circuit.ts';
import {
    CreateFileRequest,
    DirectoryContentsResponse,
    FileElementDto,
    ProjectContentsResponse,
} from '@/api/dto/filesystem.ts';

/** A circuit of the project that can be dropped in as a subcircuit. Mirrors the backend response. */
export interface SubcircuitOption {
    circuitId: string;
    /** The file holding the circuit, so it can be opened for editing. */
    fileId: string;
    /** The file the circuit belongs to; what the box is labelled with. */
    name: string;
    qubitCount: number;
    /** Zero for a circuit that exists but is still empty — dropping it in would do nothing. */
    operationCount: number;
}

/** Extension of the files that hold a circuit; anything else cannot become a subcircuit. */
export const CIRCUIT_FILE_EXTENSION = '.qasm';

/**
 * The project's other circuits, offered as subcircuits.
 *
 * Deliberately its own endpoint rather than walking the project and reading each file's circuit:
 * reading a circuit by file *creates* one if it does not exist, so listing that way would give every
 * file in the project a circuit just because the library was open.
 *
 * @returns the options and a way to reload them after one was added
 */
export function useSubcircuitOptions(
    projectId: string | null,
    currentCircuitId: string | undefined,
): { options: SubcircuitOption[]; reload: () => void } {
    const [options, setOptions] = useState<SubcircuitOption[]>([]);
    const [reloadToken, setReloadToken] = useState(0);

    useEffect(() => {
        if (!projectId) {
            setOptions([]);
            return;
        }

        let cancelled = false;
        const query = currentCircuitId ? `?excludeCircuitId=${encodeURIComponent(currentCircuitId)}` : '';
        api.get<SubcircuitOption[]>(`/api/circuit/project/${projectId}/subcircuits${query}`)
            .then((loaded) => {
                if (!cancelled) setOptions(loaded);
            })
            .catch(() => {
                // The library is still usable without them; the built-ins and custom gates stay.
                if (!cancelled) setOptions([]);
            });

        return () => {
            cancelled = true;
        };
    }, [projectId, currentCircuitId, reloadToken]);

    const reload = useCallback(() => setReloadToken((token) => token + 1), []);

    return { options, reload };
}

/** Every file in the project, flattened out of the directory tree. */
export async function collectProjectFiles(elements: FileElementDto[]): Promise<FileElementDto[]> {
    const files: FileElementDto[] = [];
    for (const element of elements) {
        if (element.type === 'file') {
            files.push(element);
        } else if (element.type === 'directory') {
            const directory = await api.get<DirectoryContentsResponse>(`/api/directory/${element.id}`);
            if (directory.contents) {
                files.push(...(await collectProjectFiles(directory.contents)));
            }
        }
    }
    return files;
}

/**
 * The project's circuit files that are not offered as a subcircuit yet.
 *
 * Both kinds qualify: a file that has no circuit at all, and one that has a circuit but was never
 * declared to be a building block - the user's main circuit is exactly the second kind, and it must
 * stay pickable in case they do want it as one.
 */
export async function findUndeclaredCircuitFiles(
    projectId: string,
    known: SubcircuitOption[],
    currentCircuitFileName: string | undefined,
): Promise<FileElementDto[]> {
    const project = await api.get<ProjectContentsResponse>(`/api/project/${projectId}`);
    const files = project.contents ? await collectProjectFiles(project.contents) : [];
    const taken = new Set(known.map((option) => option.name));

    return files.filter(
        (file) =>
            file.name.toLowerCase().endsWith(CIRCUIT_FILE_EXTENSION) &&
            !taken.has(file.name) &&
            file.name !== currentCircuitFileName,
    );
}

/**
 * Declares a file's circuit to be a subcircuit, creating the circuit if the file has none yet.
 *
 * Being a subcircuit is a decision rather than a side effect: a circuit exists the moment its file
 * is opened, so listing every circuit of the project would offer the user's main circuit as a
 * building block too. This is the one place that decision is recorded.
 */
export async function offerAsSubcircuit(fileId: string): Promise<CircuitResponse> {
    return api.post<CircuitResponse>(`/api/circuit/file/${fileId}/subcircuit`);
}

/** Creates a new circuit file in the project root and gives it a circuit. */
export async function createSubcircuitFile(
    projectId: string,
    name: string,
): Promise<{ fileId: string; fileName: string }> {
    const fileName = name.toLowerCase().endsWith(CIRCUIT_FILE_EXTENSION) ? name : `${name}${CIRCUIT_FILE_EXTENSION}`;
    const request: CreateFileRequest = { name: fileName };
    const created = await api.post<{ id: string }>('/api/file/', request, { headers: { 'parent-id': projectId } });
    await offerAsSubcircuit(created.id);
    return { fileId: created.id, fileName };
}
