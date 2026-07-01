import {
    DialogClose,
    FileSelect,
    ParentRefresh,
    SelectedFolder,
} from '@/views/project-manager-view/ProjectManagerContexts.ts';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu.tsx';
import { Delete } from '@/views/project-manager-view/Delete.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { JSX, useCallback, useContext, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { FileElement as IFile } from '@/views/project-manager-view/util/FileElement.tsx';
import { ListingElement } from '@/views/project-manager-view/util/TreeComponents.tsx';
import { api } from '@/api/api.ts';
import { FileDetailsResponse, RenameFileRequest } from '@/api/dto/filesystem.ts';
import { EntityForm } from '@/views/project-manager-view/util/FormUtils.tsx';
import { getFileIcon } from '@/views/project-manager-view/util/FileIcons.tsx';
import { toast } from 'sonner';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { openTab } from '@/store/tabs/tabsSlice.ts';
import { canOpenInFormalEditor, createFormalTab } from '@/views/text-editor-view/components/formal-editor/formalTab.ts';

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
    const { setId: clearSelectedFolder } = useContext(SelectedFolder);

    const dialogTrigger = (content: Promise<JSX.Element>) => {
        setOpen(true);
        content.then(setDialogContent);
    };

    const handleFileClick = () => {
        clearSelectedFolder(null);
        choose(file);
    };

    const handleClose = useCallback(() => setOpen(false), []);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <ContextMenu>
                <ContextMenuTrigger onClick={handleFileClick}>
                    <ListingElement text={name} icon={getFileIcon(name)} />
                </ContextMenuTrigger>
                <ContextMenuContent>
                    {canOpenInFormalEditor(name) && <OpenWithFormalEditor id={id} name={name} />}
                    {FileRename(id, dialogTrigger)}
                    <Delete endpoint={'/api/file/' + id} openDialog={dialogTrigger} />
                </ContextMenuContent>
            </ContextMenu>
            <DialogContent>
                <DialogClose.Provider value={handleClose}>{dialogContent}</DialogClose.Provider>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Opens the file in the formal (Dirac notation) editor as a dedicated tab.
 *
 * TEMPORARY: shows the single project circuit rather than the file's own circuit — see
 * {@link canOpenInFormalEditor}.
 */
function OpenWithFormalEditor({ id, name }: Readonly<{ id: string; name: string }>) {
    const dispatch = useAppDispatch();
    const openFormalTab = () => dispatch(openTab({ tab: createFormalTab(id, name) }));

    return <ContextMenuItem onSelect={openFormalTab}>Open with Formal Editor</ContextMenuItem>;
}

function FileRename(id: string, trigger: (element: Promise<JSX.Element>) => void) {
    const getFile = () => {
        return api.get<FileDetailsResponse>('/api/file/' + id);
    };

    const reloadParent = useContext(ParentRefresh);
    const dialog = () => {
        trigger(
            getFile().then((file) => (
                <>
                    <DialogHeader>
                        <DialogTitle>Rename File</DialogTitle>
                    </DialogHeader>
                    <RenameForm file={file} reloadParent={reloadParent} />
                </>
            )),
        );
    };

    return <ContextMenuItem onSelect={dialog}>Rename</ContextMenuItem>;
}

function RenameForm({ file, reloadParent }: Readonly<{ file: IFile; reloadParent: () => void }>) {
    const close = useContext(DialogClose);
    const onSubmit = (name: string) => {
        const body: RenameFileRequest = { name };
        api.patch('/api/file/' + file.id, body)
            .then(() => {
                reloadParent();
                close();
            })
            .catch((err) => {
                toast.error(err.message || 'Failed to rename file');
            });
    };

    return <EntityForm defaultName={file.name} onSubmit={onSubmit} ignoreExtension={true} label="File Name" />;
}
