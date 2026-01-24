package edu.kit.quak.infrastructure.library.in.web.rest.dto;

import java.util.List;

public record GateDefinitionResponse(
        String id,
        String name,
        String category,
        String description,
        int qubitCount,
        String symbol,
        List<String> parameters,
        InspectorInfoResponse inspectorInfo) {
    // Ensure parameters list is not null
    public GateDefinitionResponse {
        if (parameters == null) {
            parameters = List.of();
        }
    }

    public record InspectorInfoResponse(
            String operatorDefinition,
            List<TruthTableEntryResponse> truthTable,
            MatrixInfoResponse matrix) {}

    public record TruthTableEntryResponse(String input, String output) {}

    public record MatrixInfoResponse(
            String display, int rows, int cols, List<List<String>> computable) {}
}
