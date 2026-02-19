import { FileSelect, ParentRefresh } from '@/views/project-manager-view/ProjectManagerView.tsx';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu.tsx';
import { Delete } from '@/views/project-manager-view/Delete.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { JSX, useContext, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { File as IFile } from '@/views/project-manager-view/util/FileElement.tsx';
import { ListingElement } from '@/views/project-manager-view/util/TreeComponents.tsx';
import { api } from '@/api/api.ts';
import { FileDetailsResponse, RenameFileRequest } from '@/api/dto/filesystem.ts';
import { EntityForm } from '@/views/project-manager-view/util/FormUtils.tsx';
import { getFileIcon } from '@/views/project-manager-view/util/FileIcons.tsx';

/**
 * Displays a {@link IFile File}
 * @param file The file-Element
 * @constructor
 */
export function File(file: Readonly<IFile>) {
    const { name, id } = file;
    const [open, setOpen] = useState(false);
    const [dialogContent, setDialogContent] = useState(<Skeleton className="h-5 mt-5" />);
    const choose = useContext(FileSelect);

    const dialogTrigger = (content: Promise<JSX.Element>) => {
        setOpen(true);
        content.then(setDialogContent);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <ContextMenu>
                <ContextMenuTrigger onClick={() => choose(file)}>
                    <ListingElement text={name} icon={getFileIcon(name)} />
                </ContextMenuTrigger>
                <ContextMenuContent>
                    {FileEdit(id, dialogTrigger)}
                    <Delete endpoint={'/api/file/' + id} openDialog={dialogTrigger} />
                </ContextMenuContent>
            </ContextMenu>
            <DialogContent>{dialogContent}</DialogContent>
        </Dialog>
    );
}

function FileEdit(id: string, trigger: (element: Promise<JSX.Element>) => void) {
    const getFile = () => {
        return api.get<FileDetailsResponse>('/api/file/' + id);
    };

    const reloadParent = useContext(ParentRefresh);
    const dialog = () => {
        trigger(
            getFile().then((file) => (
                <>
                    <DialogHeader>
                        <DialogTitle>Edit File</DialogTitle>
                    </DialogHeader>
                    <EditForm file={file} reloadParent={reloadParent} />
                </>
            )),
        );
    };

    return <ContextMenuItem onSelect={dialog}>Edit</ContextMenuItem>;
}

function EditForm({ file, reloadParent }: Readonly<{ file: IFile; reloadParent: () => void }>) {
    const onSubmit = (name: string) => {
        const body: RenameFileRequest = { name };
        api.patch('/api/file/' + file.id, body).then(reloadParent);
    };

    return <EntityForm defaultName={file.name} onSubmit={onSubmit} ignoreExtension={true} />;
}
