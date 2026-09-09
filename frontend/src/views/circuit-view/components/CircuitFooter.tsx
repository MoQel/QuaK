import { UiLayer } from '@/views/circuit-view/util/types.ts';
import { CELL_WIDTH, LABEL_WIDTH } from '@/views/circuit-view/util/layout.ts';

interface CircuitFooterProps {
    uiLayers: UiLayer[];
    circuitWidth: number;
}

export function CircuitFooter({ uiLayers, circuitWidth }: Readonly<CircuitFooterProps>) {
    return (
        <div
            className={`flex font-mono text-sm sticky bottom-0 z-10 bg-bg-subtle border-t border-border shrink-0`}
            style={{ width: circuitWidth, paddingLeft: LABEL_WIDTH }}
        >
            <div className="flex border-l border-border">
                {Array.from({ length: uiLayers.length }, (_, i) => (
                    <span
                        key={i}
                        className={`text-text shrink-0 flex justify-center items-center py-1 border-r border-border`}
                        style={{ width: CELL_WIDTH }}
                    >
                        {i + 1}
                    </span>
                ))}
            </div>
        </div>
    );
}
