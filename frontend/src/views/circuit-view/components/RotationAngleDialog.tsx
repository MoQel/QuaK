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
import { formatRotationAngle, parseRotationAngle } from '@/views/circuit-view/util/angle.ts';

/** The gate whose angle is being edited; null closes the dialog. */
export interface AngleEditTarget {
    operationId: string;
    /** Shown in the title, e.g. `"RX"`. */
    identifier: string;
    angle: number;
}

interface RotationAngleDialogProps {
    target: AngleEditTarget | null;
    onSubmit: (operationId: string, angle: number) => void;
    onClose: () => void;
}

/**
 * Edits the rotation angle of an rx/ry/rz gate.
 *
 * The field starts out holding exactly what the gate's box shows (`π/2`), and the same notation is
 * what it accepts back — see `parseRotationAngle`. Anything unreadable blocks the save instead of
 * being coerced to a number, because a silently wrong angle is a circuit that computes something
 * else without looking any different.
 */
export function RotationAngleDialog({ target, onSubmit, onClose }: Readonly<RotationAngleDialogProps>) {
    // Kept rendered while the dialog fades out: dropping it the moment `open` goes false would
    // leave an empty box animating away for 150ms.
    const lastTargetRef = useRef(target);
    if (target !== null) lastTargetRef.current = target;
    const shown = lastTargetRef.current;

    return (
        <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-sm">
                {shown && (
                    // Keyed on the gate so switching to another one re-seeds the field with its angle
                    // instead of keeping whatever was typed for the previous gate.
                    <AngleForm key={shown.operationId} target={shown} onSubmit={onSubmit} onClose={onClose} />
                )}
            </DialogContent>
        </Dialog>
    );
}

function AngleForm({ target, onSubmit, onClose }: Readonly<RotationAngleDialogProps & { target: AngleEditTarget }>) {
    const [text, setText] = useState(() => formatRotationAngle(target.angle));

    const parsed = parseRotationAngle(text);
    const isValid = parsed !== null;

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (parsed === null) return;
        onSubmit(target.operationId, parsed);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit}>
            <DialogHeader>
                <DialogTitle>Rotation angle</DialogTitle>
                <DialogDescription>
                    Angle of the {target.identifier} gate, in radians. Accepts π notation — <code>pi/2</code>,{' '}
                    <code>-π/4</code>, <code>2*pi/3</code>, <code>tau</code> — or a plain number.
                </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2 py-4">
                <Label htmlFor="rotation-angle">Angle</Label>
                <Input
                    id="rotation-angle"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    autoFocus
                    autoComplete="off"
                    aria-invalid={!isValid}
                />
                {/* The reading in radians, so the effect of π notation is visible before saving. */}
                <p className={`text-xs ${isValid ? 'text-text-muted' : 'text-destructive'}`}>
                    {isValid ? `= ${parsed.toFixed(4)} rad` : 'Not a valid angle'}
                </p>
            </div>

            <DialogFooter>
                <Button type="button" variant="secondary" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" disabled={!isValid}>
                    Save
                </Button>
            </DialogFooter>
        </form>
    );
}
