import { FileElementContainer } from '@/views/project-manager-view/FileElementContainer.tsx';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { DialogClose, ParentRefresh } from '@/views/project-manager-view/ProjectManagerContexts.ts';
import { JSX, useContext } from 'react';
import { ContextMenuItem } from '@/components/ui/context-menu.tsx';
import { Folder, FolderOpen } from 'lucide-react';
import {
    Directory as IDirectory,
    getElementForFileElement,
    sort,
} from '@/views/project-manager-view/util/FileElement.tsx';

import { api } from '@/api/api.ts';
import { DirectoryContentsResponse, DirectoryRequest } from '@/api/dto/filesystem.ts';
import { EntityForm } from '@/views/project-manager-view/util/FormUtils.tsx';
import { toast } from 'sonner';

/**
 * Displays a {@link IDirectory Directory}
 * @param name The display-name of the directory
 * @param id The id of the directory
 * @constructor
 */
export function Directory({ name, id }: Readonly<{ name: string; id: string }>) {
    const icon = (open: boolean) => (open ? <FolderOpen /> : <Folder />);
    return (
        <FileElementContainer
            name={name}
            id={id}
            getContent={fetchDirectoryContent}
            edit={DirectoryRename}
            icon={icon}
            deletePath={'/api/directory/' + id}
        />
    );
}

function DirectoryRename(id: string, openDialog: (element: Promise<JSX.Element>) => void) {
    const getDir = () => {
        return api.get<DirectoryContentsResponse>('/api/directory/' + id);
    };

    const reloadParent = useContext(ParentRefresh);
    const dialog = () => {
        openDialog(
            getDir().then((dir) => (
                <>
                    <DialogHeader>
                        <DialogTitle>Rename Directory</DialogTitle>
                    </DialogHeader>
                    <RenameForm dir={dir} reloadParent={reloadParent} />
                </>
            )),
        );
    };

    return <ContextMenuItem onSelect={dialog}>Rename</ContextMenuItem>;
}

function RenameForm({ dir, reloadParent }: Readonly<{ dir: IDirectory; reloadParent: () => void }>) {
    const close = useContext(DialogClose);
    const onSubmit = (name: string) => {
        const body: DirectoryRequest = { name };
        api.patch('/api/directory/' + dir.id, body)
            .then(() => {
                reloadParent();
                close();
            })
            .catch((err) => {
                toast.error(err.message || 'Failed to rename directory');
            });
    };

    return <EntityForm defaultName={dir.name} onSubmit={onSubmit} label="Directory Name" />;
}

async function fetchDirectoryContent(id: string) {
    const dir = await api.get<DirectoryContentsResponse>('/api/directory/' + id);
    const elements = [];
    if (dir.contents) {
        for (const element of sort(dir.contents)) {
            elements.push(getElementForFileElement(element));
        }
    }
    return elements;
}
