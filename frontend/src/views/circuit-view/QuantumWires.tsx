import styles from "@/App.module.css";
import { Badge } from "@/components/ui/badge"

type QuantumWiresProps = {
    qubitIndex: number;
    length: number;
};

export function QuantumWires({qubitIndex, length}: QuantumWiresProps) {
    return (
        <div className="flex items-center space-x-2 pb-5">
            <div>
                <Badge className="w-12 h-8 font-mono text-sm font-bold select-none">
                    |q{qubitIndex}&gt;
                </Badge>
            </div>
            <div className={`${styles.lines} shrink-0`} style={{width: `${length}px`}}/>
        </div>
    );
}