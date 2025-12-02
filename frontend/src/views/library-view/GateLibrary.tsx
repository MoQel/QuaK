import { LibraryElement } from "@/views/library-view/LibraryElement.tsx";
import {QuantumGate} from "@/views/QuantumGate.tsx";
import {useEffect, useState} from "react";

export async function fetchGates(): Promise<QuantumGate[]> {
  const response = await fetch('/gates');
  const data = await response.json();
  return data;
}

function GateLibrary() {
    const [gates, setGates] = useState<QuantumGate[]>([]);
      useEffect(() => {
        fetchGates().then((data) => {
          console.log("gates from API", data);
          setGates(data);
        });
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
