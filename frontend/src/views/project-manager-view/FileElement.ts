export interface FileElement {
    id: string,
    name: string,
    type: string,
}

export function sort(elements: FileElement[]) {
    return elements.sort((a, b) => {
        if (a.type === undefined) {
            if (b.type !== undefined) {
                return -1
            }
        } else {
            if (b.type === undefined) {
                return 1
            } else {
                const comp = a.type.toLowerCase().localeCompare(b.type.toLowerCase())
                if (comp !== 0) {
                    return comp
                }
            }
        }
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    })
}