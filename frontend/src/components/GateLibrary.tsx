import styles from '../App.module.css'
import {Button} from "@/components/ui/button.tsx";
import {Badge} from "@/components/ui/badge.tsx";


function GateLibrary() {

    return (
        <>
            <Badge
                draggable
                className={styles.gate}

            >
                X
            </Badge>
        </>
    )
}

export default GateLibrary;