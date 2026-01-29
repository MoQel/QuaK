import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import styles from '@/App.module.css';
import GateLibrary from '@/views/library-view/GateLibrary.tsx';
import { Button } from '@/components/ui/button';
import { List, LayoutGrid } from 'lucide-react';
import GateList from '@/views/library-view/GateList.tsx';
import { useEffect, useState } from 'react';
import { api } from '@/api/api.ts';
import { GateDefinitionResponse } from '@/api/dto/library.ts';

interface GateLibraryViewProps {
    onGateSelect?: (gate: GateDefinitionResponse) => void;
}

export function GateLibraryView({ onGateSelect }: GateLibraryViewProps) {
    const [boxMode, setBoxMode] = useState(true);
    const [gates, setGates] = useState<GateDefinitionResponse[]>([]);

    // Load Data centralized (Single Source of Truth)
    useEffect(() => {
        api.get<GateDefinitionResponse[]>('/api/gates')
            .then((gates) => setGates(gates))
            .catch((e) => console.error('Failed to fetch gates:', e));
    }, []);

    const handleGateClick = (gate: GateDefinitionResponse) => {
        if (onGateSelect) {
            onGateSelect(gate);
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
                    <div className={`h-full ${boxMode ? 'overflow-y-auto' : ''} ${styles.availableGateContainer}`}>
                        {boxMode && <GateLibrary gates={gates} onGateClick={handleGateClick} />}
                        {!boxMode && <GateList gates={gates} onGateClick={handleGateClick} />}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
