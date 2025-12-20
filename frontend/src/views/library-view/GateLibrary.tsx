import {LibraryElement} from "@/views/library-view/LibraryElement.tsx";
import {QuantumGate} from "@/views/library-view/QuantumGate.ts";
import {useEffect, useState} from "react";
import {api} from "@/api/api";

export async function fetchGates(): Promise<QuantumGate[]> {
  const response = await fetch('/gates');
  return await response.json();
}

function GateLibrary() {
    const [gates, setGates] = useState<QuantumGate[]>([]);
      useEffect(() => {
          api.get<QuantumGate[]>("/gates")
            .then((data) => {
              console.log("gates from API", data);
              setGates(data);
            })
            .catch((e) => console.error("Failed to fetch gates:", e));
        }, []);


    return (
        <div
            className="grid grid-cols-5 gap-4"
        >
            {gates.map((gate, index) => (
                <LibraryElement
                    key={`${gate.name}-${index}`}
                    id={gate.name}
                    type={gate.symbol}
                />
            ))}
        </div>
    );
}

export default GateLibrary;
