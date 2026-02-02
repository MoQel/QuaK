import { FileSelect, ParentRefresh } from '@/views/project-manager-view/ProjectManagerView.tsx';
import { FileCode, FileJson } from 'lucide-react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu.tsx';
import { Delete } from '@/views/project-manager-view/Delete.tsx';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { JSX, useContext, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField } from '@/components/ui/form.tsx';
import { File as IFile } from '@/views/project-manager-view/util/FileElement.tsx';
import { DialogCloseButtons, TextInput } from '@/views/project-manager-view/util/FormComponents.tsx';
import { ListingElement } from '@/views/project-manager-view/util/TreeComponents.tsx';
import { api } from '@/api/api.ts';
import { FileDetailsResponse, RenameFileRequest } from '@/api/dto/filesystem.ts';
import pythonIcon from '@/assets/python.png';
import qrispIcon from '@/assets/qrisp.png';
import qasmIcon from '@/assets/qasm.png';

/**
 * Displays a {@link IFile File}
 * @param file The file-Element
 * @constructor
 */
export function File(file: IFile) {
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
                        <DialogTitle>Edit Directory</DialogTitle>
                        <DialogDescription>
                            Edit file with id <i>{id}</i>.
                        </DialogDescription>
                    </DialogHeader>
                    <EditForm file={file} reloadParent={reloadParent} />
                </>
            )),
        );
    };

    return <ContextMenuItem onSelect={dialog}>Edit</ContextMenuItem>;
}

function EditForm({ file, reloadParent }: { file: IFile; reloadParent: () => void }) {
    const formSchema = z.object({
        name: z.string().min(1, {
            message: 'Filename must be at least 1 characters.',
        }),
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: file.name,
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        const body: RenameFileRequest = {
            name: values.name,
        };

        api.patch('/api/file/' + file.id, body).then(reloadParent);
    };
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                    name="name"
                    control={form.control}
                    render={({ field }) => <TextInput placeholder="Enter a new name" label="Name" field={field} />}
                />
                <DialogCloseButtons submit="Save" />
            </form>
        </Form>
    );
}

const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    const iconClass = 'w-3 h-3 object-contain';

    switch (extension) {
        case 'py':
            return <img src={pythonIcon} alt="Python" className={iconClass} />;
        case 'qasm':
            return <img src={qasmIcon} alt="OpenQASM" className={iconClass} />;
        case 'qrisp':
            return <img src={qrispIcon} alt="Qrisp" className={iconClass} />;
        case 'json':
            return <FileJson className="w-3 h-3" />;
        default:
            return <FileCode className="w-3 h-3" />;
    }
};
