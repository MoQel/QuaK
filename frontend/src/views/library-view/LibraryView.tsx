import { Card, CardContent, CardHeader } from '@/components/ui/card.tsx';
import LibraryBoxView from '@/views/library-view/LibraryBoxView.tsx';
import { Button } from '@/components/ui/button';
import { List, LayoutGrid } from 'lucide-react';
import LibraryListView from '@/views/library-view/LibraryListView.tsx';
import { useEffect, useState } from 'react';
import { api } from '@/api/api.ts';
import { OperationDefinitionResponse } from '@/api/dto/library.ts';

interface LibraryViewProps {
    onOperationSelect: (operation: OperationDefinitionResponse) => void;
}

export function LibraryView({ onOperationSelect }: Readonly<LibraryViewProps>) {
    const [boxMode, setBoxMode] = useState(true);
    const [quantumOperations, setQuantumOperations] = useState<OperationDefinitionResponse[]>([]);

    // Load Data centralized (Single Source of Truth)
    useEffect(() => {
        api.get<OperationDefinitionResponse[]>('/api/operations')
            .then((operations) => setQuantumOperations(operations))
            .catch((e) => console.error('Failed to fetch quantum operations:', e));
    }, []);

    return (
        <Card className="relative flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden border-none bg-bg-subtle pb-0">
            <CardHeader className="relative flex h-9 w-full items-center justify-end">
                <Button onClick={() => setBoxMode(!boxMode)} variant="default" size="icon">
                    {boxMode && <List />}
                    {!boxMode && <LayoutGrid />}
                </Button>
            </CardHeader>

            <CardContent className={`min-h-0 flex-1 p-3 ${boxMode ? 'overflow-y-auto' : 'overflow-hidden'}`}>
                {boxMode && (
                    <LibraryBoxView quantumOperations={quantumOperations} onOperationClick={onOperationSelect} />
                )}
                {!boxMode && (
                    <LibraryListView quantumOperations={quantumOperations} onOperationClick={onOperationSelect} />
                )}
            </CardContent>
        </Card>
    );
}
