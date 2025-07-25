import styles from "@/App.module.css";
import {Badge} from "@/components/ui/badge"
import {QuantumGate} from "@/views/library-view/QuantumGate.tsx";

type QuantumWiresProps = {
    gates: QuantumGate[];
    qubitIndex: number;
    length: number;
};

export function QuantumWires({gates, qubitIndex, length}: QuantumWiresProps) {

    return (
        <div className="flex items-center space-x-2 pb-5">

            <div>
                <Badge className="w-12 h-8 font-mono text-sm font-bold select-none">
                    |q{qubitIndex}&gt;
                </Badge>
            </div>

            <div className="relative" style={{width: `${length}px`, height: "40px"}}>

                <div className={`${styles.lines} absolute top-1/2 w-full`}/>
                <div className="flex items-center h-full space-x-3 pl-3 relative z-10">
                    {/* Buffer element */}
                    <Badge className={`${styles.gate} invisible`}/>
                    {/* Actual quantum Gates */}
                    {gates.map((gate, index) => (
                        <Badge key={index} className={`${styles.gate} ${gate.type === 'DUMMY' ? 'invisible' : ''}`}>
                            {gate.type}
                        </Badge>
                    ))}
                </div>
            </div>
        </div>
    );
}