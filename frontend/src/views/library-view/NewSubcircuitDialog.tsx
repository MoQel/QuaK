import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { openTab } from '@/store/tabs/tabsSlice.ts';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { FileElementDto } from '@/api/dto/filesystem.ts';
import {
    createSubcircuitFile,
    findUndeclaredCircuitFiles,
    offerAsSubcircuit,
    SubcircuitOption,
} from '@/views/library-view/util/subcircuits.ts';

interface NewSubcircuitDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string | null;
    /** Already listed subcircuits, so an existing file is not offered twice. */
    known: SubcircuitOption[];
    /** Reload the library's list once one was added. */
    onAdded: () => void;
}

/**
 * Makes a circuit available as a subcircuit, either by creating a file for it or by adopting one
 * that already exists.
 *
 * <p>Both are needed because a file only gets a circuit once something asks for it: a `.qasm` file
 * that was only ever edited as text has none, and would therefore never appear in the library on its
 * own. Adopting it is the one place where that creating read is intended.
 */
export function NewSubcircuitDialog({
    open,
    onOpenChange,
    projectId,
    known,
    onAdded,
}: Readonly<NewSubcircuitDialogProps>) {
    const [mode, setMode] = useState<'new' | 'existing'>('new');
    const [name, setName] = useState('');
    const [candidates, setCandidates] = useState<FileElementDto[]>([]);
    const [selectedFileId, setSelectedFileId] = useState('');
    const [isBusy, setIsBusy] = useState(false);
    const dispatch = useDispatch();

    useEffect(() => {
        if (!open || !projectId) return;
        setName('');
        setSelectedFileId('');
        findUndeclaredCircuitFiles(projectId, known, undefined)
            .then(setCandidates)
            .catch(() => setCandidates([]));
        // Deliberately not depending on `known`: it is a fresh array on every render of the
        // library, so the candidate list would reload continuously while the dialog is open. It is
        // only read once here, when the dialog opens.
    }, [open, projectId]);

    const submit = async () => {
        if (!projectId) return;
        setIsBusy(true);
        try {
            if (mode === 'new') {
                const trimmed = name.trim();
                if (!trimmed) {
                    toast.error('Please give the subcircuit a name.');
                    return;
                }
                const { fileId, fileName } = await createSubcircuitFile(projectId, trimmed);
                // Opened straight away: a new subcircuit is empty, and an empty one is useless
                // until something is in it. Creating it without opening it left no way to do that.
                dispatch(openTab({ tab: { id: fileId, title: fileName, language: '' } }));
                toast.success(`Created ${fileName}`);
            } else {
                if (!selectedFileId) {
                    toast.error('Please pick a file.');
                    return;
                }
                const adopted = candidates.find((file) => file.id === selectedFileId);
                await offerAsSubcircuit(selectedFileId);
                dispatch(openTab({ tab: { id: selectedFileId, title: adopted?.name ?? '', language: '' } }));
                toast.success('Added to the subcircuit library');
            }
            onAdded();
            onOpenChange(false);
        } catch {
            toast.error('Could not create the subcircuit.');
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                    <DialogTitle>New subcircuit</DialogTitle>
                    <DialogDescription>
                        A subcircuit is another circuit of this project, dropped into a circuit as one box.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    <div className="flex gap-2">
                        {/* `outline` is the accented variant here, not the muted one: it carries
                            --special, while `default` is the unobtrusive bg-bg. Naming the active
                            mode `default` marked the wrong button. */}
                        <Button
                            type="button"
                            size="sm"
                            variant={mode === 'new' ? 'outline' : 'secondary'}
                            onClick={() => setMode('new')}
                        >
                            New file
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={mode === 'existing' ? 'outline' : 'secondary'}
                            onClick={() => setMode('existing')}
                        >
                            Existing file
                        </Button>
                    </div>

                    {mode === 'new' ? (
                        <div className="grid gap-2">
                            <Label htmlFor="subcircuit-name">Name</Label>
                            <Input
                                id="subcircuit-name"
                                placeholder="adder"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && submit()}
                            />
                            <p className="text-xs text-muted-foreground">
                                Creates <span className="font-mono">{(name.trim() || 'adder') + '.qasm'}</span> in the
                                project and opens it for editing.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            <Label htmlFor="subcircuit-file">Circuit file</Label>
                            <Select value={selectedFileId} onValueChange={setSelectedFileId}>
                                <SelectTrigger id="subcircuit-file" className="w-full">
                                    <SelectValue
                                        placeholder={
                                            candidates.length ? 'Pick a file' : 'Every circuit file is already offered'
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent className="bg-bg border-border text-text">
                                    {candidates.map((file) => (
                                        <SelectItem key={file.id} value={file.id}>
                                            {file.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Any circuit file of this project that is not offered as a subcircuit yet.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isBusy}>
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={isBusy}>
                        Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
