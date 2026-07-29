// @quak/qasm-transform — OpenQASM 3 <-> circuit, in TypeScript.
//
// The VSCode extension has no backend (D3), so it cannot use the Java parser the
// web IDE calls over REST. Both are generated from the *same* grammars in
// backend/src/main/antlr — see check:generated, which fails the build if the
// grammars move and this parser does not follow.

export { parseQasm, type ParseResult, type QasmSyntaxError } from './parse.ts';
