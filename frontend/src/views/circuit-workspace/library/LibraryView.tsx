import { Card, CardContent, CardHeader } from '@/components/ui/card.tsx';
import LibraryBoxView from '@/views/circuit-workspace/library/components/LibraryBoxView.tsx';
import { Button } from '@/components/ui/button.tsx';
import { List, LayoutGrid } from 'lucide-react';
import LibraryListView from '@/views/circuit-workspace/library/components/LibraryListView.tsx';
import { useState } from 'react';
import { OperationDefinitionResponse } from '@/api/dto/library.ts';

interface LibraryViewProps {
    operations: OperationDefinitionResponse[];
    onOperationSelect: (operation: OperationDefinitionResponse) => void;
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
