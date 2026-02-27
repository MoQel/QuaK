import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import styles from '@/App.module.css';
import QuantumOperationLibrary from '@/views/library-view/QuantumOperationLibrary.tsx';
import { Button } from '@/components/ui/button';
import { List, LayoutGrid } from 'lucide-react';
import QuantumOperationList from '@/views/library-view/QuantumOperationList.tsx';
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

    const handleOperationClick = (operation: OperationDefinitionResponse) => {
        if (onOperationSelect) {
            onOperationSelect(operation);
        }
    };

    return (
        <Card className="w-full h-full min-h-0 relative flex flex-col overflow-hidden">
            <CardHeader className="w-full flex justify-center items-center relative">
                <CardTitle className="text-center">Library</CardTitle>

                <Button onClick={() => setBoxMode(!boxMode)} variant="default" size="icon" className="absolute right-5">
                    {boxMode && <List />}
                    {!boxMode && <LayoutGrid />}
                </Button>
            </CardHeader>

            <CardContent className="flex-1 min-h-0 overflow-hidden p-3">
                <div className="h-full w-full min-h-0">
                    <div
                        className={`h-full ${boxMode ? 'overflow-y-auto' : ''} ${styles.availableQuantumOperationContainer}`}
                    >
                        {boxMode && (
                            <QuantumOperationLibrary
                                quantumOperations={quantumOperations}
                                onOperationClick={handleOperationClick}
                            />
                        )}
                        {!boxMode && (
                            <QuantumOperationList
                                quantumOperations={quantumOperations}
                                onOperationClick={handleOperationClick}
                            />
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
