export const CELL_WIDTH = 64;
export const QUBIT_HEIGHT = 48;
export const LABEL_WIDTH = 48;

/**
 * How much a gate shrinks inside a repetition frame.
 *
 * The frame is drawn between the columns, so at full size the gates crowd right up against its
 * border. Taking a little off makes the box read as containing them rather than as another gate
 * sitting on the wires — and it distinguishes framed gates at a glance without changing their colour
 * or shape, which carry meaning.
 */
export const LOOP_GATE_SCALE = 0.8;
