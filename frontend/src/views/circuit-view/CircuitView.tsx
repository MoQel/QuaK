import {Card, CardContent} from "@/components/ui/card.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Minus, Plus, Trash} from "lucide-react";
import {Fragment, useCallback} from "react";
import {quantumGates} from "@/views/circuit-view/InitCircuit.tsx";
import styles from "@/App.module.css";
import {Qubit} from "@/views/circuit-view/Qubit.tsx";

export function CircuitView() {
    // TODO: Replace quantumGates with API response
    const qubitNames = [...new Set(quantumGates.map(g => g.qubit))];

    const maxWireLength = Math.max(
        ...Object.values(
            quantumGates.reduce(
                (m, { qubit }) => (m[qubit] = (m[qubit] ?? 0) + 1, m),
                {} as Record<string, number>
            )
        )
    );

    // TODO: Implement when there is an API in the backend
    const addQubit = useCallback(() => {}, []);
    const removeQubit = useCallback(() => {}, []);
    const resetCircuit = useCallback(() => {}, []);

    return (
        <Card className="h-full overflow-hidden">
            <CardContent className="flex flex-col h-full">

                {/* Buttons */}
                <div className="pb-5 flex justify-end space-x-3">
                    <Button onClick={addQubit} size="icon" className="size-8"><Plus/></Button>
                    <Button onClick={removeQubit} size="icon" className="size-8"><Minus/></Button>
                    <Button onClick={resetCircuit} size="icon" className="size-8"><Trash/></Button>
                </div>

                {/* Wires container */}
                <div className="flex-1 overflow-auto">
                    {
                        qubitNames.map((name, idx) => (
                            <Qubit
                                key={name}
                                name={name}
                                initGates={quantumGates
                                    .filter(initGate => initGate.qubit === name)
                                    .map(({qubit, ...gate}) => gate)}
                                qubitIndex={idx}
                            />
                        ))
                    }
                    {/* Gate Indexing of form: | 1 | 2 | ... */}
                    <div className={`${styles.gateIndexSpacing} flex font-mono text-sm border-l border-gray-500`}>
                        {Array.from({length: maxWireLength}, (_, i) => (
                            <Fragment key={i}>
                                <span
                                    className={`${styles.gateIndexSize} text-gray-500 justify-center border-r border-gray-500`}
                                >
                                    {i + 1}
                                </span>
                            </Fragment>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}