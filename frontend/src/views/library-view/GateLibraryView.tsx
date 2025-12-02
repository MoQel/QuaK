import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import styles from "@/App.module.css";
import GateLibrary from "@/views/library-view/GateLibrary.tsx";
import { Button } from "@/components/ui/button"
import { List,  LayoutGrid } from "lucide-react";
import GateList from "@/views/library-view/GateList.tsx";
import { useState } from 'react';


export function GateLibraryView() {

    const [boxMode, setBoxMode] = useState(true);

    return (
        <Card className="w-full relative">
            <CardHeader className="w-full flex justify-center items-center relative">
                <CardTitle className="text-center">
                  Library
                </CardTitle>

                <Button
                  onClick={() =>
                      setBoxMode(!(boxMode))
                  }
                  variant="default"
                  size="icon"
                  className="absolute right-5"
                >
                  {boxMode && <List />}
                  {!(boxMode) && <LayoutGrid/>}
                </Button>
              </CardHeader>

            <CardContent>
                <div className={styles.availableGateContainer}>
                    {boxMode && <GateLibrary/>}
                    {!(boxMode) && <GateList/>}
                </div>
            </CardContent>
        </Card>
    )
}