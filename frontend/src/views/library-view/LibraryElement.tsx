import {Badge} from "@/components/ui/badge.tsx";
import {TextIcon} from "@/views/TextIcon.tsx"
import styles from "@/App.module.css";
import {useDraggable} from "@dnd-kit/core";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

type LibraryElementProps = {
  id: string;
  type: string; // symbol of the QuantumGate or type of the CircuitCell
  onClick?: () => void;
  matrix?: string;
};

export function LibraryElement({id, type, onClick, matrix}: LibraryElementProps) {
    const DELAY_DURATION = 700;

    const {attributes, listeners, setNodeRef, isDragging} = useDraggable({
        id: id,
        data: {
            source: "library",
            type: type
        }
    })
    const Icon = TextIcon(type);

    const gateBadge = (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            id={id}
            onClick={onClick}
            className={`cursor-pointer ${isDragging ? "opacity-50" : ""}`}
        >
            <Badge className={styles.library}>
                <Icon />
            </Badge>
        </div>
    );

    if (!matrix || isDragging) {
        return gateBadge;
    }

    return (
        <Tooltip delayDuration={DELAY_DURATION}>
            <TooltipTrigger asChild>
                {gateBadge}
            </TooltipTrigger>

            <TooltipContent
                side="right"
                className="bg-popover text-popover-foreground border shadow-xl p-3 min-w-[150px] z-[9999]"
            >
                <div className="text-xs text-muted-foreground mb-2 text-center font-semibold">
                    Matrix Representation
                </div>
                <div className="overflow-x-auto flex justify-center">
                    <BlockMath math={matrix} />
                </div>
            </TooltipContent>
        </Tooltip>
    )
}
