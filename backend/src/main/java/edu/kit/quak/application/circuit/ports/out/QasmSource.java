package edu.kit.quak.application.circuit.ports.out;

/**
 * A resolved {@code include} target: the source text plus the identity of the file it came from.
 *
 * <p>The {@code fileId} is what makes nested includes work — an include inside an included file is
 * resolved relative to <em>that</em> file, not relative to the file the parse started from.
 *
 * @param fileId id of the file the source was loaded from, used as the base for nested includes
 * @param name   file name, used only for error messages
 * @param code   the file's OpenQASM source
 */
public record QasmSource(String fileId, String name, String code) {}
