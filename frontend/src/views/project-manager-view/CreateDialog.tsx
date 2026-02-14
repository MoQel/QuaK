import { DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { Form, FormField } from '@/components/ui/form.tsx';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ParentRefresh } from '@/views/project-manager-view/ProjectManagerContexts.ts';
import { JSX, useContext } from 'react';
import {
    ContextMenuItem,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import { DialogCloseButtons, TextInput } from '@/views/project-manager-view/util/FormComponents.tsx';
import { api } from '@/api/api.ts';
import { CreateFileRequest, DirectoryRequest } from '@/api/dto/filesystem';
import { EntityForm } from '@/views/project-manager-view/util/FormUtils.tsx';
import { useFocusSelection } from '@/hooks/useFocusSelection.ts';

interface CreateDialogProps {
    id: string;
    openDialog: (element: Promise<JSX.Element>) => void;
}

/**
 * Provides a {@link ContextMenuItem} that allows for the creation of {@link FileElement FileElements}.
 * @param id The id of the parent of the new element
 * @param openDialog A function that opens a dialog and displays the given elements after their promise resolves.
 * @constructor
 */
export function CreateDialog({ id, openDialog }: Readonly<CreateDialogProps>) {
    const dialog = (e: JSX.Element) => openDialog(Promise.resolve(e));
    return (
        <ContextMenuSub>
            <ContextMenuSubTrigger>New...</ContextMenuSubTrigger>
            <ContextMenuSubContent>
                <ContextMenuItem
                    onSelect={() =>
                        dialog(
                            <>
                                <DialogHeader>
                                    <DialogTitle>Create a new file</DialogTitle>
                                </DialogHeader>
                                <CreateFile parent={id} />
                            </>,
                        )
                    }
                >
                    File
                </ContextMenuItem>
                <ContextMenuItem
                    onSelect={() =>
                        dialog(
                            <>
                                <DialogHeader>
                                    <DialogTitle>Create a new Directory</DialogTitle>
                                </DialogHeader>
                                <CreateDirectory parent={id} />
                            </>,
                        )
                    }
                >
                    Directory
                </ContextMenuItem>
            </ContextMenuSubContent>
        </ContextMenuSub>
    );
}

function CreateFile({ parent }: Readonly<{ parent: string }>) {
    // Hook handles ref, focus, and selection logic
    const inputRef = useFocusSelection('new_file.txt', true);
    const reloadParent = useContext(ParentRefresh);

    const formSchema = z.object({
        name: z.string().min(1, { message: 'Filename must be at least 1 characters.' }),
        contentType: z.string(),
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: 'new_file.txt',
            contentType: 'application/json',
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        const body: CreateFileRequest = {
            name: values.name,
            contentType: 'text/plain', // TODO: Issue
        };
        api.post('/api/file/', body, { headers: { 'parent-id': parent } }).then(reloadParent);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <TextInput inputRef={inputRef} placeholder="new_file.txt" label="Filename" field={field} />
                    )}
                />
                <FormField
                    control={form.control}
                    name="contentType"
                    render={({ field }) => (
                        <TextInput placeholder="application/json" label="Content-Type" field={field} />
                    )}
                />
                <DialogCloseButtons />
            </form>
        </Form>
    );
}

function CreateDirectory({ parent }: Readonly<{ parent: string }>) {
    const reloadParent = useContext(ParentRefresh);

    const onSubmit = (name: string) => {
        const body: DirectoryRequest = { name };
        api.post('/api/directory/', body, { headers: { 'parent-id': parent } }).then(reloadParent);
    };

    return <EntityForm defaultName="folder" onSubmit={onSubmit} label="Name of the directory" placeholder="folder" />;
}
