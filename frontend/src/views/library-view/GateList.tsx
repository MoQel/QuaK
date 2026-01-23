import { useMemo } from "react";
import { LibraryElement } from "@/views/library-view/LibraryElement.tsx";
import { GateDefinitionResponse } from '@/api/dto/library.ts'

interface GateListProps {
    gates: GateDefinitionResponse[];
    onGateClick: (gate: GateDefinitionResponse) => void;
}

function GateList({ gates, onGateClick }: GateListProps) {

    // Group and sort by type and then by name
    const groupedGates = useMemo(() => {
        const groups: Record<string, GateDefinitionResponse[]> = {};

        for (const gate of gates) {
            const type = gate.category;
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(gate);
        }

        return Object.entries(groups)
            .sort(([typeA], [typeB]) => typeA.localeCompare(typeB))
            .map(([type, gatesInGroup]) => ({
                type,
                gates: gatesInGroup.sort((a, b) => a.name.localeCompare(b.name)),
            }));
    }, [gates]);

    return (
        <div

            className="w-full h-full overflow-y-auto will-change-transform transform-gpu border border-border rounded-md bg-bg-dark">
            {groupedGates.map((group, index) => (
                <section key={group.type}>
                    <div

                        className="sticky top-0 z-10 bg-bg text-text border-b border-border font-semibold text-sm px-4 py-3"
                        style={{

                            borderTop: index === 0 ? "none" : "1px solid var(--border)",
                        }}
                    >
                        {group.type}
                    </div>

                    <ul className="list-none m-0 p-0">
                        {group.gates.map((gate) => (
                            <li
                                key={gate.name}
                                className="
                                    border-b border-border
                                    last:border-b-0
                                    hover:bg-bg transition-colors
                                    cursor-pointer px-4 py-3"
                                onClick={() => onGateClick(gate)}
                            >

                            <div className="flex items-center gap-4">
                                    <div className="w-12 min-w-48px flex justify-center items-center">
                                        <LibraryElement
                                            id={gate.id}
                                            symbol={gate.symbol}
                                            matrix={gate.inspectorInfo.matrix.display}
                                            onClick={() => onGateClick(gate)}
                                        />
                                    </div>

                                    <div className="text-left">
                                        <div className="font-semibold text-sm text-text mb-2px">
                                            {gate.name}
                                        </div>
                                        {gate.description && (

                                            <div className="text-xs text-text-muted leading-tight">
                                                {gate.description}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
}

export default GateList;