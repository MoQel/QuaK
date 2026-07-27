package edu.kit.quak.application.circuit.ports.out;

import java.util.Optional;

/**
 * Loads the target of an {@code include "..."} statement while parsing OpenQASM code.
 *
 * <p>Implementations are already bound to a user, so the parser itself stays free of access
 * control. {@link #NONE} is the loader for parses without file context (the content-only
 * {@code /parse} endpoint without a {@code fileId}, and most unit tests): every include of a
 * non-standard library then fails with a clear error instead of being silently ignored.
 */
@FunctionalInterface
public interface QasmIncludeLoader {
    /** A loader that resolves nothing, for parsing code that has no file to resolve includes against. */
    QasmIncludeLoader NONE = (fromFileId, path) -> Optional.empty();

    /**
     * Loads the file {@code path} refers to, as seen from the file currently being parsed.
     *
     * @param fromFileId id of the file containing the include statement, or {@code null} when the
     *                   parse started from unsaved content
     * @param path       the literal path from the include statement, e.g. {@code "bell.qasm"}
     * @return the resolved source, or empty if no such file exists
     */
    Optional<QasmSource> load(String fromFileId, String path);
}
