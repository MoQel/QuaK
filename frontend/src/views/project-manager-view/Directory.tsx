import { FileElementContainer } from '@/views/project-manager-view/FileElementContainer.tsx';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { ParentRefresh } from '@/views/project-manager-view/ProjectManagerView.tsx';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField } from '@/components/ui/form.tsx';
import { JSX, useContext } from 'react';
import { ContextMenuItem } from '@/components/ui/context-menu.tsx';
import { Folder, FolderOpen } from 'lucide-react';
import {
    Directory as IDirectory,
    getElementForFileElement,
    sort,
} from '@/views/project-manager-view/util/FileElement.tsx';

import { DialogCloseButtons, TextInput } from '@/views/project-manager-view/util/FormComponents.tsx';
import { api } from '@/api/api.ts';
import { DirectoryContentsResponse, DirectoryRequest } from '@/api/dto/filesystem.ts';

/**
 * Displays a {@link IDirectory Directory}
 * @param name The display-name of the directory
 * @param id The id of the directory
 * @constructor
 */
export function Directory({ name, id }: { name: string; id: string }) {
    const icon = (open: boolean) => (open ? <FolderOpen /> : <Folder />);
    return (
        <FileElementContainer
            name={name}
            id={id}
            getContent={fetchDirectoryContent}
            edit={DirectoryEdit}
            icon={icon}
            deletePath={'/api/directory/' + id}
        />
    );
}

/**
 * Provides a {@link ContextMenuItem} to edit a given directory
 * @param id The id of the directory to edit
 * @param openDialog A function that opens a dialog and displays the given elements after their promise resolves.
 * @constructor
 */
function DirectoryEdit(id: string, openDialog: (element: Promise<JSX.Element>) => void) {
    const getDir = () => {
        return api.get<DirectoryContentsResponse>('/api/directory/' + id);
    };

    const reloadParent = useContext(ParentRefresh);
    const dialog = () => {
        openDialog(
            getDir().then((dir) => (
                <>
                    <DialogHeader>
                        <DialogTitle>Edit Directory</DialogTitle>
                        <DialogDescription>
                            Edit directory with id <i>{id}</i>.
                        </DialogDescription>
                    </DialogHeader>
                    <EditForm dir={dir} reloadParent={reloadParent} />
                </>
            )),
        );
    };

    return <ContextMenuItem onSelect={dialog}>Edit</ContextMenuItem>;
}

function EditForm({ dir, reloadParent }: { dir: IDirectory; reloadParent: () => void }) {
    const formSchema = z.object({
        name: z.string().min(1, {
            message: 'Directory name must be at least 1 characters.',
        }),
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: dir.name,
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        const body: DirectoryRequest = {
            name: values.name,
        };

        api.patch('/api/directory/' + dir.id, body).then(reloadParent);
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
