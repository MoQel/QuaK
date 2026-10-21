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

type GuestLogoutDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
};

/** Asks a guest to confirm signing out, since the guest account cannot be reached again afterwards. */
export function GuestLogoutDialog({ open, onOpenChange, onConfirm }: Readonly<GuestLogoutDialogProps>) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>End guest session?</AlertDialogTitle>
                    <AlertDialogDescription>
                        After signing out you cannot return to this guest session. Its projects are lost and deleted
                        automatically.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel variant="secondary">Cancel</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={onConfirm}>
                        End session
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
