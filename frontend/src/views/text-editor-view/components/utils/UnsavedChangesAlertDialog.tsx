import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { closeAll, closeGroup, closeOthers, closeTab, setPendingClose } from '@/store/tabs/tabsSlice.ts';

export function UnsavedChangesAlertDialog() {
    const dispatch = useAppDispatch();
    const pendingAction = useAppSelector((state) => state.tabs.pendingCloseAction);

    const isOpen = pendingAction !== null;

    const handleConfirm = () => {
        if (!pendingAction) return;

        // Map the typed pending action back to the actual reducers
        switch (pendingAction.type) {
            case 'tab':
                dispatch(closeTab(pendingAction.payload));
                break;
            case 'group':
                dispatch(closeGroup(pendingAction.payload.groupId));
                break;
            case 'others':
                dispatch(closeOthers(pendingAction.payload));
                break;
            case 'all':
                dispatch(closeAll());
                break;
        }

        // Clear the pending state
        dispatch(setPendingClose(null));
    };

    const handleCancel = () => {
        // Discard the intercepted action
        dispatch(setPendingClose(null));
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
                    <AlertDialogDescription>
                        You are about to close one or more tabs that contain unsaved changes. If you continue, these
                        changes will be irretrievably lost. Do you still want to close the tabs?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel variant="secondary" onClick={handleCancel}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={handleConfirm}>
                        Discard changes
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
