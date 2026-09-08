import { Card, CardContent, CardHeader } from '@/components/ui/card.tsx';
import styles from '@/App.module.css';
import LibraryBoxView from '@/views/library-view/LibraryBoxView.tsx';
import { Button } from '@/components/ui/button';
import { List, LayoutGrid } from 'lucide-react';
import LibraryListView from '@/views/library-view/LibraryListView.tsx';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/api/api.ts';
import { OperationDefinitionResponse } from '@/api/dto/library.ts';
import { useCircuitTabs } from '@/contexts/CircuitTabsContext.tsx';
import { collectCustomGates } from '@/views/library-view/util/customGates.ts';
import { useSubcircuitOptions } from '@/views/library-view/util/subcircuits.ts';
import { NewSubcircuitDialog } from '@/views/library-view/NewSubcircuitDialog.tsx';
import { useProject } from '@/contexts/ProjectContext.tsx';

interface LibraryViewProps {
    onOperationSelect: (operation: OperationDefinitionResponse) => void;
}

export function LibraryView({ onOperationSelect }: Readonly<LibraryViewProps>) {
    const [boxMode, setBoxMode] = useState(true);
    const [quantumOperations, setQuantumOperations] = useState<OperationDefinitionResponse[]>([]);

    // The gates the open circuit itself defines. They are not part of the catalogue — the backend
    // only serves the built-ins — so they are read straight off the circuit and follow it: parsing
    // a file with a new `gate` in it makes that gate appear here without a round trip.
    const { activeCircuit } = useCircuitTabs();
    const customGates = useMemo(() => collectCustomGates(activeCircuit), [activeCircuit]);

    // The project's other circuits, which can be dropped in as a box referencing them.
    const { projectId } = useProject();
    const { options: subcircuits, reload: reloadSubcircuits } = useSubcircuitOptions(projectId, activeCircuit?.id);
    const [isNewSubcircuitOpen, setIsNewSubcircuitOpen] = useState(false);

    // Load Data centralized (Single Source of Truth)
    useEffect(() => {
        api.get<OperationDefinitionResponse[]>('/api/operations')
            .then((operations) => setQuantumOperations(operations))
            .catch((e) => console.error('Failed to fetch quantum operations:', e));
    }, []);

    const handleOperationClick = (operation: OperationDefinitionResponse) => {
        if (onOperationSelect) {
            onOperationSelect(operation);
        }
    };

    return (
        <Card className="w-full h-full min-h-0 relative flex flex-col overflow-hidden border-none gap-3 pb-0">
            <CardHeader className="w-full flex justify-center items-center relative">
                <Button onClick={() => setBoxMode(!boxMode)} variant="default" size="icon" className="absolute right-5">
                    {boxMode && <List />}
                    {!boxMode && <LayoutGrid />}
                </Button>
            </CardHeader>

            <CardContent className="flex-1 min-h-0 overflow-hidden p-3">
                <div className="h-full w-full min-h-0 flex flex-col gap-3">
                    <div
                        className={`flex-1 min-h-0 ${boxMode ? 'overflow-y-auto' : ''} ${styles.availableQuantumOperationContainer}`}
                    >
                        {boxMode && (
                            <LibraryBoxView
                                quantumOperations={quantumOperations}
                                customGates={customGates}
                                subcircuits={subcircuits}
                                onOperationClick={handleOperationClick}
                                onNewSubcircuit={projectId ? () => setIsNewSubcircuitOpen(true) : undefined}
                            />
                        )}
                        {!boxMode && (
                            <LibraryListView
                                quantumOperations={quantumOperations}
                                onOperationClick={handleOperationClick}
                            />
                        )}
                    </div>

                    {/* Capped and separately scrollable, so a file full of custom gates cannot push
                        the built-ins off the panel. Absent entirely while there are none. */}
                    {/* Always present, unlike the custom gates: without the section there would be
                        no place to create the first subcircuit from. */}
                    <NewSubcircuitDialog
                        open={isNewSubcircuitOpen}
                        onOpenChange={setIsNewSubcircuitOpen}
                        projectId={projectId}
                        known={subcircuits}
                        onAdded={reloadSubcircuits}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
