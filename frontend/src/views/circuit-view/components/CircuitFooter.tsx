import styles from '@/App.module.css';
import { UiLayer } from '@/views/circuit-view/util/types.ts';

interface CircuitFooterProps {
    uiLayers: UiLayer[];
}

export function CircuitFooter({ uiLayers }: Readonly<CircuitFooterProps>) {
    return (
        <div className={`${styles.quantumOperationIndexSpacing} flex font-mono text-sm border-l border-border`}>
            {Array.from({ length: uiLayers.length }, (_, i) => (
                <span
                    key={i}
                    className={`${styles.quantumOperationIndexSize} text-text shrink-0 flex justify-center border-r border-border`}
                >
                    {i + 1}
                </span>
            ))}
        </div>
    );
}
