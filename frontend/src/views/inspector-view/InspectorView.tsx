import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {QuantumGate} from "@/views/library-view/QuantumGate.ts";

interface InspectorViewProps {
    gate: QuantumGate | undefined;
}

export function InspectorView( {gate}: InspectorViewProps) {
    console.log("Inspector Update - Received Gate:", gate);
    return (
        <Card className="w-full">
            <CardHeader className="w-full">
                <CardTitle>
                    Inspector
                </CardTitle>
            </CardHeader>
            <CardContent>
            </CardContent>
        </Card>
    )
}