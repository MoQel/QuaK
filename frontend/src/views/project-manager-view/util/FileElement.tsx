import {FileElementContainer} from "@/views/project-manager-view/FileElementContainer.tsx";
import {File} from "@/views/project-manager-view/File.tsx";
import {Directory} from "@/views/project-manager-view/Directory.tsx";
import {Project} from "@/views/project-manager-view/Project.tsx";
import {
    DirectoryContentsResponse,
    FileDetailsResponse,
    FileElementDto,
    ProjectContentsResponse
} from "@/api/dto/filesystem.ts";

export interface FileElement {
    id: string,
    name: string,
    type: string,
}

export interface FileElementContainer extends FileElement {
    contents: Array<FileElement>
}

export type Project = FileElementContainer

export type Directory = FileElementContainer

export interface File extends FileElement {
    contentType: string,
}

/**
 * Sorts a given array of {@link FileElement FileElements} into a predefined order.
 * Elements get sorted in respect to type and name.
 * @param elements The elements to sort
 */
export function sort(elements: FileElementDto[]) {
    return elements.sort((a, b) => {
        const typeA = a.type || "z";
        const typeB = b.type || "z";

        const score = (type: string) => {
            if (type === "directory") return 1;
            if (type === "file") return 2;
            return 3;
        };

        const scoreA = score(typeA);
        const scoreB = score(typeB);

        if (scoreA !== scoreB) {
            return scoreA - scoreB;
        }

        const nameA = a.name || "";
        const nameB = b.name || "";

        const nameComparison = nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });

        if (nameComparison !== 0) {
            return nameComparison;
        }

        const dateA = a.createdOn || "";
        const dateB = b.createdOn || "";

        return dateA.localeCompare(dateB);
    });
}

/**
 * Parses a given {@link FileElement} into a {@link JSX.Element}
 * @param object The object to parse
 */

export function getElementForFileElement(object: FileElementDto) {
    if (object.type === "file") {
        return (<File {...object as unknown as FileDetailsResponse} key={object.id}/>)
    } else if (object.type === "directory") {
        return (<Directory {...object as unknown as DirectoryContentsResponse} key={object.id}/>)
    } else {
        return (<Project {...object as unknown as ProjectContentsResponse} key={object.id}/>) // ID als Key ist wichtig!
    }
}