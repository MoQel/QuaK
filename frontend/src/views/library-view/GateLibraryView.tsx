import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import styles from "@/App.module.css";
import GateLibrary from "@/views/library-view/GateLibrary.tsx";

export function GateLibraryView() {
    return (
        <Card className="w-full">
            <CardHeader className="w-full">
                <CardTitle>
                    Library
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className={styles.availableGateContainer}>
                    <GateLibrary/>
                </div>
            </CardContent>
        </Card>
    )
}