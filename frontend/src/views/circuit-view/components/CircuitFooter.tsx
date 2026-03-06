import { UiLayer } from '@/views/circuit-view/util/types.ts';
import { CELL_WIDTH, LABEL_WIDTH } from '@/views/circuit-view/util/layout.ts';

interface CircuitFooterProps {
    uiLayers: UiLayer[];
}

export function CircuitFooter({ uiLayers }: Readonly<CircuitFooterProps>) {
    return (
        <div className={`flex font-mono text-sm border-l border-border`} style={{ marginLeft: LABEL_WIDTH }}>
            {Array.from({ length: uiLayers.length }, (_, i) => (
                <span
                    key={i}
                    className={`text-text shrink-0 flex justify-center border-r border-border`}
                    style={{ width: CELL_WIDTH }}
                >
                    {i + 1}
                </span>
            ))}
        </div>
    );
}
