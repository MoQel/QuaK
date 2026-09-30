import { Card, CardContent, CardHeader } from '@quak/ui/card';
import LibraryBoxView from './components/LibraryBoxView.tsx';
import { Button } from '@quak/ui/button';
import { List, LayoutGrid } from 'lucide-react';
import LibraryListView from './components/LibraryListView.tsx';
import { useMemo, useState } from 'react';
import { OperationDefinitionResponse, SubcircuitOption } from '@quak/circuit-core';
import { collectCustomGates } from './util/customGates.ts';
import { useCircuitStore } from '../CircuitStoreContext.tsx';

interface LibraryViewProps {
    operations: OperationDefinitionResponse[];
    onOperationSelect?: (operation: OperationDefinitionResponse) => void;
    subcircuits?: SubcircuitOption[];
    onNewSubcircuit?: () => void;
    onOpenSubcircuit?: (option: SubcircuitOption) => void;
    onRemoveSubcircuit?: (option: SubcircuitOption) => void;
}

export function LibraryView({
    operations,
    onOperationSelect,
    subcircuits = [],
    onNewSubcircuit,
    onOpenSubcircuit,
    onRemoveSubcircuit,
}: Readonly<LibraryViewProps>) {
    const [boxMode, setBoxMode] = useState(true);

    // The gates the open circuit defines itself, read off the circuit so they follow its changes.
    const { circuit } = useCircuitStore();
    const customGates = useMemo(() => collectCustomGates(circuit), [circuit]);

    const subcircuitHandlers = { subcircuits, onOpenSubcircuit, onRemoveSubcircuit };

    return (
        <Card className="relative flex h-full min-h-0 w-full flex-col gap-1 overflow-hidden border-none bg-bg-subtle py-1">
            <CardHeader className="relative flex h-9 w-full items-center justify-end">
                <Button onClick={() => setBoxMode(!boxMode)} variant="default" size="icon">
                    {boxMode && <List />}
                    {!boxMode && <LayoutGrid />}
                </Button>
            </CardHeader>

            <CardContent className={`min-h-0 flex-1 px-3 pb-2 pt-0 ${boxMode ? 'overflow-y-auto' : 'overflow-hidden'}`}>
                {boxMode && (
                    <LibraryBoxView
                        quantumOperations={operations}
                        customGates={customGates}
                        onOperationClick={onOperationSelect}
                        onNewSubcircuit={onNewSubcircuit}
                        {...subcircuitHandlers}
                    />
                )}
                {!boxMode && (
                    <LibraryListView
                        quantumOperations={operations}
                        customGates={customGates}
                        onOperationClick={onOperationSelect}
                        {...subcircuitHandlers}
                    />
                )}
            </CardContent>
        </Card>
    );
}
