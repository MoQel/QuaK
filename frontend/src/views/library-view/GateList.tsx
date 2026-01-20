import {useMemo} from "react";
import { LibraryElement } from "@/views/library-view/LibraryElement.tsx";
import {GateDefinitionResponse} from '@/api/dto/library.ts'

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
            style={{
                maxHeight: "300px",
                width: "400px",
                overflowY: "auto",
                border: "1px solid #444",
                borderRadius: "8px",
                backgroundColor: "#111",
                padding: "0"
            }}
        >
            {groupedGates.map((group, index) => (
                <section key={group.type}>
                    {/* Type heading */}
                    <div
                        style={{
                            padding: "8px 12px",
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            backgroundColor: "#1f1f1f",
                            borderTop: index === 0 ? "none" : "1px solid #333",
                            borderBottom: "1px solid #333",
                        }}
                    >
                        {group.type}
                    </div>

                    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                        {group.gates.map((gate) => (
                            <li
                                key={gate.name}
                                style={{
                                    padding: "10px 12px",
                                    borderBottom: "1px solid #222",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "14px",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "48px",
                                            minWidth: "48px",
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                        }}
                                    >
                                        <LibraryElement id={gate.id} symbol={gate.symbol} matrix={gate.inspectorInfo.matrix.display} onClick={() => onGateClick(gate)} />
                                    </div>

                                    <div style={{ textAlign: "left" }}>
                                        <div
                                            style={{
                                                fontWeight: 600,
                                                fontSize: "0.9rem",
                                                marginBottom: gate.description ? "2px" : 0,
                                            }}
                                        >
                                            {gate.name}
                                        </div>
                                        {gate.description && (
                                            <div
                                                style={{
                                                    fontSize: "0.8rem",
                                                    opacity: 0.85,
                                                    lineHeight: 1.25,
                                                }}
                                            >
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