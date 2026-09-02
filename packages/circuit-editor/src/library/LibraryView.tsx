import { Card, CardContent, CardHeader } from '@quak/ui/card';
import LibraryBoxView from './components/LibraryBoxView.tsx';
import { Button } from '@quak/ui/button';
import { List, LayoutGrid } from 'lucide-react';
import LibraryListView from './components/LibraryListView.tsx';
import { useState } from 'react';
import { OperationDefinitionResponse } from '@quak/circuit-core';

interface LibraryViewProps {
    operations: OperationDefinitionResponse[];
    onOperationSelect?: (operation: OperationDefinitionResponse) => void;
}

export function LibraryView({ operations, onOperationSelect }: Readonly<LibraryViewProps>) {
    const [boxMode, setBoxMode] = useState(true);

    return (
        <Card className="relative flex h-full min-h-0 w-full flex-col gap-1 overflow-hidden border-none bg-bg-subtle py-1">
            <CardHeader className="relative flex h-9 w-full items-center justify-end">
                <Button onClick={() => setBoxMode(!boxMode)} variant="default" size="icon">
                    {boxMode && <List />}
                    {!boxMode && <LayoutGrid />}
                </Button>
            </CardHeader>

            <CardContent className={`min-h-0 flex-1 px-3 pb-2 pt-0 ${boxMode ? 'overflow-y-auto' : 'overflow-hidden'}`}>
                {boxMode && <LibraryBoxView quantumOperations={operations} onOperationClick={onOperationSelect} />}
                {!boxMode && <LibraryListView quantumOperations={operations} onOperationClick={onOperationSelect} />}
            </CardContent>
        </Card>
    );
}
