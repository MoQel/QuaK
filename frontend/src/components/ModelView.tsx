import QCircuit from "@/components/ui/QCircuit.tsx";
import QLPEditor from "@/components/ui/QLPEditor.tsx";

function ModelView() {
    return (
        <div className="flex flex-row shrink h-full">
            <div className="basis-2/3 pt-16">
                <QCircuit/>
            </div>
            <div className="basis-1/3 overflow-hidden">
                <QLPEditor/>
            </div>
        </div>
    );
}

export default ModelView;