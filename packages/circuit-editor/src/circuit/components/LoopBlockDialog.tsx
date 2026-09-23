import { useRef, useState } from 'react';
import { Button } from '@quak/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@quak/ui/dialog';
import { Input } from '@quak/ui/input';
import { Label } from '@quak/ui/label';

/** A loop about to be created over an already chosen set of operations. */
export interface LoopDraft {
    /** Identifies this attempt, so re-opening the dialog starts from a fresh form. */
    id: string;
    operationIds: string[];
    initialRepeatCount?: number;
    isEditing?: boolean;
    loopBlockId?: string;
}

interface LoopBlockDialogProps {
    draft: LoopDraft | null;
    onSubmit: (operationIds: string[], repeatCount: number, loopBlockId?: string) => void;
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

/** The frame only annotates gates, so the wording stresses that they stay editable. */
function describeLoop(isEditing: boolean | undefined, gateCount: number): string {
    if (isEditing) return 'Adjust how often this loop executes.';
    if (gateCount === 1) {
        return 'Wraps the selected gate in a loop. It stays editable — the frame only says how often it runs.';
    }
    return `Wraps the selected ${gateCount} gates in a loop. They stay editable — the frame only says how often they run.`;
}

function RepeatForm({
    draft,
    onSubmit,
    onClose,
}: Readonly<Omit<LoopBlockDialogProps, 'draft'> & { draft: LoopDraft }>) {
    const [text, setText] = useState(String(draft.initialRepeatCount ?? 2));

    const repeatCount = Number(text);
    const isValid = Number.isInteger(repeatCount) && repeatCount >= MIN_REPEAT_COUNT;

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!isValid) return;
        onSubmit(draft.operationIds, repeatCount, draft.loopBlockId);
        onClose();
    };

    const gateCount = draft.operationIds.length;
    const description = describeLoop(draft.isEditing, gateCount);

    return (
        <form onSubmit={handleSubmit}>
            <DialogHeader>
                <DialogTitle>{draft.isEditing ? 'Edit Loop' : 'Repeat'}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
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
                    {draft.isEditing ? 'Save changes' : 'Add loop'}
                </Button>
            </DialogFooter>
        </form>
    );
}
