// @quak/qasm-transform — OpenQASM 3 <-> circuit, in TypeScript.
//
// Intended for the VSCode extension only. The web IDE talks to the backend over
// REST and should not bundle this parser. Both parsers are generated from the
// same grammars in backend/src/main/antlr; check:generated fails when this copy
// falls behind.

export { parseQasm, type ParseResult, type QasmComment, type QasmSyntaxError } from './parse.ts';
export {
    classify,
    isEditable,
    toCircuit,
    type DocumentClassification,
    type QasmPreamble,
    type QasmRejection,
    type RejectionKind,
    type ToCircuitResult,
} from './toCircuit.ts';
export { formatAngle, toQasm } from './toQasm.ts';
