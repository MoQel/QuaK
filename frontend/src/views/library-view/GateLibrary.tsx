import styles from '../../App.module.css'
import {Badge} from "@/components/ui/badge.tsx";
import {quantumLibraryGates} from "@/views/library-view/QuantumGates.tsx";


function GateLibrary() {

    return (
        <>
            {quantumLibraryGates.map((gate) =>(
                <Badge
                    key={gate.id}
                    draggable
                    onDragStart={() => {}}
                    className={styles.gate}
                >
                    {gate.type}
                </Badge>
            ))
            }
        </>
    )
}

export default GateLibrary;
