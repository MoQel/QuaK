import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import styles from "@/App.module.css";
import GateLibrary from "@/views/library-view/GateLibrary.tsx";
import { Button } from "@/components/ui/button"
import { List,  LayoutGrid } from "lucide-react";
import GateList from "@/views/library-view/GateList.tsx";
import {useEffect, useState} from 'react';
import {QuantumGate} from "@/views/QuantumGate.tsx";
import {api} from "@/api/api.ts";
import {GateResponseDto} from "@/api/dto/library.ts";
import {GateMapper} from "@/api/mapper/GateMapper.ts";

export function GateLibraryView() {

    const [boxMode, setBoxMode] = useState(true);
    const [gates, setGates] = useState<QuantumGate[]>([]);

    // Load Data centralized (Single Source of Truth)
    useEffect(() => {
        api.get<GateResponseDto[]>("/gates")
            .then((dtos) => {
                const domainGates = GateMapper.toDomainList(dtos);
                setGates(domainGates);
            })
            .catch((e) => console.error("Failed to fetch gates:", e));
    }, []);

    return (
        <Card className="w-full relative">
            <CardHeader className="w-full flex justify-center items-center relative">
                <CardTitle className="text-center">
                    Library
                </CardTitle>

                <Button
                    onClick={() =>
                        setBoxMode(!(boxMode))
                    }
                    variant="default"
                    size="icon"
                    className="absolute right-5"
                >
                    {boxMode && <List />}
                    {!(boxMode) && <LayoutGrid/>}
                </Button>
            </CardHeader>

            <CardContent>
                <div className={styles.availableGateContainer}>
                    {/* Daten als Prop weitergeben */}
                    {boxMode && <GateLibrary gates={gates}/>}
                    {!(boxMode) && <GateList gates={gates}/>}
                </div>
            </CardContent>
        </Card>
    )
}