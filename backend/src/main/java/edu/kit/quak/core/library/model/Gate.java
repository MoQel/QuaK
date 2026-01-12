package edu.kit.quak.core.library.model;

import java.util.Collections;
import java.util.List;

public record Gate(
        String id,
        String name,
        String type,
        String description,
        int qubitCount,
        String symbol,
        List<String> parameters,
        InspectorInfo inspectorInfo
) {
    // Compact constructor to ensure non-null lists and handle optional InspectorInfo
    public Gate {
        parameters = parameters != null ? Collections.unmodifiableList(parameters) : List.of();
        // InspectorInfo can be null - it's optional for gates that don't need inspector details
    }

    /**
     * Contains detailed information about a gate for display in the Inspector view.
     * All string fields containing mathematical notation should use LaTeX format.
     *
     * @param operatorDefinition LaTeX string representing the gate's operator definition (e.g., "H = |0\rangle\langle0| + |1\rangle\langle1|")
     * @param truthTable List of input/output state mappings for the gate
     * @param matrix Matrix representation of the gate with both LaTeX display format and computable values
     */
    public record InspectorInfo(
            String operatorDefinition,
            List<TruthTableEntry> truthTable,
            MatrixInfo matrix
    ) {
        // ensures non-null
        public InspectorInfo {
            truthTable = truthTable != null ? Collections.unmodifiableList(truthTable) : List.of();
            operatorDefinition = operatorDefinition != null ? operatorDefinition : "";
        }
    }

    /**
     * Represents a single row in the truth table logic.
     */
    public record TruthTableEntry(
            String input,  // e.g., "|0>"
            String output  // e.g., "|1>"
    ) {}

    /**
     * Dual representation of the gate matrix:
     * 1. Display (LaTeX) for reading.
     * 2. Computable (Math strings) for calculating numeric values in the frontend.
     */
    public record MatrixInfo(
            String display, // LaTeX string
            int rows,
            int cols,
            List<List<String>> computable // 2D grid of math strings (e.g. "cos(theta/2)")
    ) {
        // ensures non-null and validates dimensions
        public MatrixInfo {
            display = display != null ? display : "";
            computable = computable != null ? Collections.unmodifiableList(computable) : List.of();
            
            // Validate dimensions match actual computable matrix size
            if (!computable.isEmpty()) {
                if (computable.size() != rows) {
                    throw new IllegalArgumentException(
                        "MatrixInfo rows field (%d) does not match computable matrix size (%d)"
                            .formatted(rows, computable.size())
                    );
                }
                // Validate all rows have the same number of columns
                for (int i = 0; i < computable.size(); i++) {
                    List<String> row = computable.get(i);
                    if (row.size() != cols) {
                        throw new IllegalArgumentException(
                            "MatrixInfo cols field (%d) does not match row %d size (%d)"
                                .formatted(cols, i, row.size())
                        );
                    }
                }
            }
        }
    }
}
