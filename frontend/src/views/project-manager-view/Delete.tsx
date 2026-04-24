import { ContextMenuItem } from '@/components/ui/context-menu.tsx';
import { FormEvent, JSX, useContext } from 'react';
import { DialogClose, ParentRefresh } from '@/views/project-manager-view/ProjectManagerContexts.ts';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { DialogCloseButtons } from '@/views/project-manager-view/util/FormComponents.tsx';
import { api } from '@/api/api.ts';
import { toast } from 'sonner';

/**
 * Provides a {@link ContextMenuItem} That allows for deletion of an HTTP-Path
 * @param endpoint The endpoint to send an HTTP <i>DELETE</i> request to
 * @param openDialog A function that opens a dialog and displays the given elements after their promise resolves
 * @constructor
 */
export function Delete({
    endpoint,
    openDialog,
}: Readonly<{
    endpoint: string;
    openDialog: (element: Promise<JSX.Element>) => void;
}>) {
    const reload = useContext(ParentRefresh);
    const close = useContext(DialogClose);

    const del = (event: FormEvent) => {
        event.preventDefault();
        api.delete(endpoint)
            .then(() => {
                reload();
                close();
            })
            .catch((err) => toast.error(err.message || 'Failed to delete element'));
    };

    return (
        <ContextMenuItem
            variant="destructive"
            onSelect={() =>
                openDialog(
                    Promise.resolve(
                        <>
                            <DialogHeader>
                                <DialogTitle>Are you absolutely sure?</DialogTitle>
                            </DialogHeader>
                            <DialogDescription>
                                This action will delete the selected element permanently.
                            </DialogDescription>
                            <form onSubmit={del}>
                                <DialogCloseButtons />
                            </form>
                        </>,
                    ),
                )
            }
        >
            Delete
        </ContextMenuItem>
    );
}
