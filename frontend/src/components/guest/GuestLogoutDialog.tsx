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
import { GuestUpgradeButtons } from './GuestUpgradeButtons.tsx';

type GuestLogoutDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
};

/** Asks a guest to confirm signing out, which deletes the guest, and offers to keep its projects instead. */
export function GuestLogoutDialog({ open, onOpenChange, onConfirm }: Readonly<GuestLogoutDialogProps>) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>End guest session?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Signing out deletes this guest session and its projects. Sign in with an account instead to keep
                        them.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <GuestUpgradeButtons className="grid grid-cols-2" />
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
