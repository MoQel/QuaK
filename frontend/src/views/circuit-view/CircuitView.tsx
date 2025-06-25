import {Card, CardContent} from "@/components/ui/card.tsx";
import styles from "@/App.module.css";

export function CircuitView() {
    return (
        <Card className="h-full">
            <CardContent>
                                <span className={styles.lines}>
                                    <span className={styles.gate}>
                                        X
                                    </span>
                                </span>
            </CardContent>
        </Card>
    )
}