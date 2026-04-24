import { File } from '@/views/project-manager-view/File.tsx';
import { Directory } from '@/views/project-manager-view/Directory.tsx';
import { Project } from '@/views/project-manager-view/Project.tsx';
import {
    DirectoryContentsResponse,
    FileDetailsResponse,
    FileElementDto,
    ProjectContentsResponse,
} from '@/api/dto/filesystem.ts';
import { orderBy } from 'lodash';

export type FileElement = FileElementDto;

export interface FileElementContainer extends FileElement {
    contents: Array<FileElement>;
}

export type Project = FileElementContainer;

export type Directory = FileElementContainer;

/**
 * Sorts file elements:
 * 1. Directories first, then Files, then Projects
 * 2. Alphabetically by name (case-insensitive)
 * 3. By creation date
 */
export function sort(elements: FileElementDto[]): FileElementDto[] {
    return orderBy(
        elements,
        [
            (el: FileElementDto) => ({ directory: 1, file: 2 })[el.type || ''] || 3,
            (el: FileElementDto) => el.name?.toLowerCase(),
            // Fallback
            'createdOn',
        ],
        ['asc', 'asc', 'asc'],
    );
}

/**
 * Parses a given {@link FileElement} into a {@link JSX.Element}
 * @param object The object to parse
 */

export function getElementForFileElement(object: FileElementDto) {
    if (object.type === 'file') {
        return <File {...(object as unknown as FileDetailsResponse)} key={object.id} />;
    } else if (object.type === 'directory') {
        return <Directory {...(object as unknown as DirectoryContentsResponse)} key={object.id} />;
    } else {
        return <Project {...(object as unknown as ProjectContentsResponse)} key={object.id} />;
    }
}
