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
    // Compact constructor to ensure non-null lists
    public Gate {
        parameters = parameters != null ? Collections.unmodifiableList(parameters) : List.of();
    }

    public record InspectorInfo(
            String operatorDefinition,      // e.g., "H = |0><0| + ..." (LaTeX)
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
        // ensures non-null
        public MatrixInfo {
            display = display != null ? display : "";
            computable = computable != null ? Collections.unmodifiableList(computable) : List.of();
        }
    }
}
