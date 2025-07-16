import {FileElementContainer} from "@/views/project-manager-view/FileElementContainer.tsx";
import {File} from "@/views/project-manager-view/File.tsx";
import {Directory} from "@/views/project-manager-view/Directory.tsx";
import {Project} from "@/views/project-manager-view/Project.tsx";

export interface FileElement {
    id: string,
    name: string,
    type: string,
}

export interface FileElementContainer extends FileElement {
    contents: Array<FileElement>
}

export interface Project extends FileElementContainer {}

export interface Directory extends FileElementContainer {}

export interface File extends FileElement {}

/**
 * Sorts a given array of {@link FileElement FileElements} into a predefined order.
 * Elements get sorted in respect to type and name.
 * @param elements The elements to sort
 */
export function sort(elements: FileElement[]) {
    return elements.sort((a, b) => {
        if (a.type === undefined) {
            if (b.type !== undefined) {
                //an existing type has more value
                return -1
            }
        } else {
            if (b.type === undefined) {
                //an existing type has more value
                return 1
            } else {
                //sort using the type-name
                const comp = a.type.toLowerCase().localeCompare(b.type.toLowerCase())
                if (comp !== 0) {
                    return comp
                }
            }
        }
        try {
            //type-name is equal: sort by actual name
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        } catch (error) {
            //In case on of the name-properties is undefined
            console.error(error)
            return 0;
        }
    })
}

/**
 * Parses a given {@link FileElement} into a {@link JSX.Element}
 * @param object The object to parse
 */
export function getElementForFileElement(object: FileElement) {
    if (object.type === "file") {
        return (<File {...object} key = {object.id}/>)
    } else if (object.type === "directory") {
        return (<Directory {...object} key = {object.id}/>)
    } else {
        return (<Project {...object}/>)
    }
}