import { useState } from 'react';
import { Button } from '@/components/ui/button.tsx';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';

interface GroupCompositeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    operationCount: number;
    onSubmit: (gateName: string) => void;
}

const IDENTIFIER_REGEX = /^[a-zA-Z_]\w*$/;

export function GroupCompositeDialog({
    open,
    onOpenChange,
    operationCount,
    onSubmit,
}: Readonly<GroupCompositeDialogProps>) {
    const [name, setName] = useState('custom_gate');
    const isValid = IDENTIFIER_REGEX.test(name.trim());

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;
        onSubmit(name.trim());
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create Composite Gate</DialogTitle>
                        <DialogDescription>
                            {operationCount === 1
                                ? 'Groups the selected operation into a single composite gate.'
                                : `Groups the selected ${operationCount} operations into a single composite gate.`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-2 py-4">
                        <Label htmlFor="composite-gate-name">Gate Name</Label>
                        <Input
                            id="composite-gate-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. bell_pair"
                            autoFocus
                            aria-invalid={!isValid}
                        />
                        {!isValid && (
                            <p className="text-xs text-destructive">
                                Must be a valid identifier (letters, digits, underscores, starting with letter or
                                underscore).
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!isValid}>
                            Group
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
