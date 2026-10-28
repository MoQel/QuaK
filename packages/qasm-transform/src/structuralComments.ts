import type { QasmComment } from './parse.ts';
import { tokenText, type SourcePosition } from './parseTree.ts';
import type {
    ClassicalDeclarationStatementContext,
    OldStyleDeclarationStatementContext,
    ProgramContext,
    QuantumDeclarationStatementContext,
    StatementContext,
} from './generated/OpenQASM3Parser.js';

/** QuaK's own readability annotations in generated QASM. */

export const registerMarker = (registerName: string): string => `// Register ${registerName}`;

export const layerMarker = (layerNumber: number): string => `// Layer ${layerNumber}`;

/** What this document's structural comments say, read in one walk. */
interface StructuralComments {
    /** Keys of the comments `toQasm` would have written itself, so they are not a user's. */
    markerKeys: Set<string>;
    /** Operation lines written inside the layer opened above them, rather than opening one. */
    continuedLayers: Set<number>;
}

/**
 * Reads the `// Register` and `// Layer` comments back. A layer marker sits above the first operation
 * of its layer, and the operations below it without a comment of their own join that layer.
 *
 * The markers have to count 1, 2, 3. At the first one out of sequence the matching stops, and that
 * comment and every later one count as the user's.
 */
export function readStructuralComments(tree: ProgramContext, comments: readonly QasmComment[]): StructuralComments {
    const commentByLine = firstCommentPerLine(comments);

    const markerKeys = new Set<string>();
    const continuedLayers = new Set<number>();
    let expectedLayer = 1;

    for (const statementOrScope of tree.statementOrScope()) {
        const statement = statementOrScope.statement();
        if (!statement) continue;

        const declaration =
            statement.quantumDeclarationStatement() ??
            statement.classicalDeclarationStatement() ??
            statement.oldStyleDeclarationStatement();
        if (declaration) {
            addRegisterMarker(markerKeys, declaration);
            continue;
        }

        const line = operationStatement(statement)?.start?.line ?? 0;
        if (line <= 1) continue;

        const above = commentByLine.get(line - 1);
        if (above === undefined) {
            // No comment above: written as part of a layer one of our markers opened.
            if (expectedLayer > 1) continuedLayers.add(line);
            continue;
        }
        if (above !== layerMarker(expectedLayer)) break;

        markerKeys.add(commentKey(line - 1, layerMarker(expectedLayer)));
        expectedLayer += 1;
    }

    return { markerKeys, continuedLayers };
}

/** Only the first comment on a line can sit above a statement. */
function firstCommentPerLine(comments: readonly QasmComment[]): Map<number, string> {
    const byLine = new Map<number, string>();
    for (const comment of comments) {
        if (!byLine.has(comment.line)) byLine.set(comment.line, comment.text.trim());
    }
    return byLine;
}

/** The statements that put operations into a layer. */
const operationStatement = (statement: StatementContext): SourcePosition | null =>
    statement.gateCallStatement() ??
    statement.measureArrowAssignmentStatement() ??
    (statement.assignmentStatement()?.measureExpression() ? statement.assignmentStatement() : null);

/** A declaration with no name has no `// Register x` we could have written above it. */
function addRegisterMarker(
    keys: Set<string>,
    declaration:
        | QuantumDeclarationStatementContext
        | ClassicalDeclarationStatementContext
        | OldStyleDeclarationStatementContext,
): void {
    const name = tokenText(declaration.Identifier());
    const line = declaration.start?.line ?? 0;
    if (name === null || line <= 1) return;

    keys.add(commentKey(line - 1, registerMarker(name)));
}

export const commentKey = (line: number, text: string): string => `${line}:${text.trim()}`;
