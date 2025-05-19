import {Card} from "@/components/ui/card.tsx";
import NodeEditor from "@/components/NodeEditor.tsx";


function QCircuit() {
    return <div className="flex justify-start px-4 h-full">
        <Card className="w-full h-full border-2 border-e-neutral-700">
                <NodeEditor/>
        </Card>
    </div>;
}

export default QCircuit;
