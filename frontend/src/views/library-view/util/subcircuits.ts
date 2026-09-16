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
 * Lists file IDs that cannot be chosen as subcircuits for the given active circuit
 * (self, already offered, or loop-forming).
 */
export async function fetchDisallowedFileIds(
    projectId: string,
    currentCircuitId: string | undefined,
): Promise<string[]> {
    const query = currentCircuitId ? `?currentCircuitId=${encodeURIComponent(currentCircuitId)}` : '';
    try {
        return await api.get<string[]>(`/api/circuit/project/${projectId}/subcircuit-disallowed-files${query}`);
    } catch {
        return [];
    }
}

/**
 * The project's circuit files that are eligible to become a subcircuit.
 * Excludes the current circuit's file, circuits that would close a loop, and circuits
 * already offered as subcircuits.
 */
export async function findUndeclaredCircuitFiles(
    projectId: string,
    currentCircuitId: string | undefined,
    currentFileId: string | undefined,
    known?: SubcircuitOption[],
): Promise<FileElementDto[]> {
    const [project, disallowedFileIds] = await Promise.all([
        api.get<ProjectContentsResponse>(`/api/project/${projectId}`),
        fetchDisallowedFileIds(projectId, currentCircuitId),
    ]);
    const files = project.contents ? await collectProjectFiles(project.contents) : [];
    const disallowed = new Set(disallowedFileIds);
    if (currentFileId) {
        disallowed.add(currentFileId);
    }
    if (known) {
        for (const option of known) {
            if (option.fileId) disallowed.add(option.fileId);
        }
    }

    return files.filter((file) => file.name.toLowerCase().endsWith(CIRCUIT_FILE_EXTENSION) && !disallowed.has(file.id));
}

/**
 * Declares a file's circuit to be a subcircuit, creating the circuit if the file has none yet.
 * When forCircuitId is provided, validates against self-reference and circular dependencies.
 */
export async function offerAsSubcircuit(fileId: string, forCircuitId?: string): Promise<CircuitResponse> {
    const query = forCircuitId ? `?forCircuitId=${encodeURIComponent(forCircuitId)}` : '';
    return api.post<CircuitResponse>(`/api/circuit/file/${fileId}/subcircuit${query}`);
}

/**
 * Removes a file's circuit from being offered as a subcircuit.
 */
export async function removeSubcircuit(fileId: string): Promise<void> {
    return api.delete<void>(`/api/circuit/file/${fileId}/subcircuit`);
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
