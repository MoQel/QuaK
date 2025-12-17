import {QuantumGate} from "@/views/QuantumGate.tsx";
import {useEffect, useState, useMemo} from "react";
import { api } from "@/api/api.ts";
import { LibraryElement } from "@/views/library-view/LibraryElement.tsx";

function GateList() {
  const [gates, setGates] = useState<QuantumGate[]>([]);

  useEffect(() => {
    api.get<QuantumGate[]>("/gates")
      .then((data) => {
        console.log("gates from API", data);
        setGates(data);
      })
      .catch((e) => console.error("Failed to fetch gates:", e));
  }, []);

  // Group and sort by type and then by name
  const groupedGates = useMemo(() => {
    const groups: Record<string, QuantumGate[]> = {};

    for (const gate of gates) {
      const type = gate.type || "Other";
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
                    backgroundColor: "#1f1f1f",           // lighter background (see #3)
                    borderTop: index === 0 ? "none" : "1px solid #333",
                    borderBottom: "1px solid #333",      // separator between header and items
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
                    borderBottom: "1px solid #222",  // bottom border instead of top
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",                    // a bit more space between icon and text
                    }}
                  >
                    <div
                      style={{
                        width: "48px",               // wider column
                        minWidth: "48px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <LibraryElement id={gate.name} type={gate.symbol} />
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

export default GateList