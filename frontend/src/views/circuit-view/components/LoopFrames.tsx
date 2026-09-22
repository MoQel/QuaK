import { CELL_WIDTH, QUBIT_HEIGHT } from '@/views/circuit-view/util/layout.ts';
import { LoopFrame } from '@/views/circuit-view/util/loopFrames.ts';

/** Gap between a frame and the cells it encloses, so the border does not touch the gates. */
const FRAME_INSET = 3;

/** Extra inset per nesting level, so an inner frame is visibly inside its outer one. */
const NESTING_INSET = 4;

/** Height of the ×n label; it is centred on the frame's top border. */
const BADGE_HEIGHT = 12;

interface LoopFramesProps {
    frames: LoopFrame[];
}

/**
 * The `×n` boxes drawn around repeated parts of the circuit.
 *
 * Deliberately the opposite of a composite gate: the box is only an outline, the gates inside stay
 * visible and individually editable. It is therefore a pure overlay — `pointer-events-none`
 * throughout, so dragging, dropping and the gates' own context menus behave as if it were not there.
 */
export function LoopFrames({ frames }: Readonly<LoopFramesProps>) {
    if (frames.length === 0) return null;

    return (
        // Above the gates (they sit on z-30), not behind them: the count is a label *on* the frame,
        // and drawn underneath it disappears behind the very gate it belongs to. The outline itself
        // never covers anything — it runs along the cell edges, while gates are centred and narrower.
        <div className="absolute inset-0 z-40 pointer-events-none">
            {frames.map((frame) => {
                const inset = FRAME_INSET + frame.depth * NESTING_INSET;

                return (
                    <div
                        key={frame.id}
                        title={`Repeated ${frame.repeatCount} times`}
                        className="absolute rounded-sm border-2 border-dashed"
                        style={{
                            left: frame.firstColumn * CELL_WIDTH + inset,
                            top: frame.topWire * QUBIT_HEIGHT + inset,
                            width: (frame.lastColumn - frame.firstColumn + 1) * CELL_WIDTH - 2 * inset,
                            height: (frame.bottomWire - frame.topWire + 1) * QUBIT_HEIGHT - 2 * inset,
                            borderColor: 'var(--loop-frame)',
                        }}
                    >
                        {/* Straddles the top border like a fieldset legend: a row is only 4px taller
                            than a gate, so there is no room for the label *inside* the frame. */}
                        <span
                            className="absolute px-[3px] text-[9px] font-semibold leading-none rounded-sm"
                            style={{
                                top: -BADGE_HEIGHT / 2,
                                right: 2,
                                height: BADGE_HEIGHT,
                                lineHeight: `${BADGE_HEIGHT}px`,
                                backgroundColor: 'var(--loop-frame)',
                                color: 'var(--bg-dark)',
                            }}
                        >
                            ×{frame.repeatCount}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
