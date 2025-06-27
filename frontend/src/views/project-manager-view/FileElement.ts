export interface FileElement {
    id: string,
    name: string,
    type: string,
}

export interface FileElementContainer extends FileElement {
    contents: Array<FileElement>
}