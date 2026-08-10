import { useRef, useState } from 'react';
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

/** A loop about to be created over an already chosen set of operations. */
export interface LoopDraft {
    /** Identifies this attempt, so re-opening the dialog starts from a fresh form. */
    id: string;
    operationIds: string[];
}

interface LoopBlockDialogProps {
    draft: LoopDraft | null;
    onSubmit: (operationIds: string[], repeatCount: number) => void;
    onClose: () => void;
}

/** The smallest repetition that is one: a body running once needs no frame around it. */
const MIN_REPEAT_COUNT = 2;

/**
 * Asks how often the selected part of the circuit should repeat.
 *
 * The lower bound is the domain's, not a UI nicety — `LoopBlock` rejects anything below 2, so
 * offering 1 would produce a request the backend refuses on save, long after the click.
 */
export function LoopBlockDialog({ draft, onSubmit, onClose }: Readonly<LoopBlockDialogProps>) {
    // Kept rendered while the dialog fades out: dropping it the moment `open` goes false would
    // leave an empty box animating away for 150ms.
    const lastDraftRef = useRef(draft);
    if (draft !== null) lastDraftRef.current = draft;
    const shown = lastDraftRef.current;

    return (
        <Dialog open={draft !== null} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-sm">
                {shown && <RepeatForm key={shown.id} draft={shown} onSubmit={onSubmit} onClose={onClose} />}
            </DialogContent>
        </Dialog>
    );
}

function RepeatForm({ draft, onSubmit, onClose }: Readonly<LoopBlockDialogProps & { draft: LoopDraft }>) {
    const [text, setText] = useState('2');

    const repeatCount = Number(text);
    const isValid = Number.isInteger(repeatCount) && repeatCount >= MIN_REPEAT_COUNT;

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!isValid) return;
        onSubmit(draft.operationIds, repeatCount);
        onClose();
    };

    const gateCount = draft.operationIds.length;

    return (
        <form onSubmit={handleSubmit}>
            <DialogHeader>
                <DialogTitle>Repeat</DialogTitle>
                <DialogDescription>
                    Wraps the selected {gateCount} {gateCount === 1 ? 'gate' : 'gates'} in a loop. They stay editable —
                    the frame only says how often they run.
                </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2 py-4">
                <Label htmlFor="repeat-count">Repetitions</Label>
                <Input
                    id="repeat-count"
                    type="number"
                    min={MIN_REPEAT_COUNT}
                    step={1}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    autoFocus
                    aria-invalid={!isValid}
                />
                {!isValid && <p className="text-xs text-destructive">At least {MIN_REPEAT_COUNT} repetitions</p>}
            </div>

            <DialogFooter>
                <Button type="button" variant="secondary" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" disabled={!isValid}>
                    Add loop
                </Button>
            </DialogFooter>
        </form>
    );
}
