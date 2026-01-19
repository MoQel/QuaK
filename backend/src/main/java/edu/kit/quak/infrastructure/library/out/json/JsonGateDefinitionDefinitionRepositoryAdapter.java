package edu.kit.quak.infrastructure.library.out.json;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.kit.quak.application.library.ports.out.GateDefinitionRepositoryPort;
import edu.kit.quak.core.library.model.GateDefinition;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Repository;

@Repository
public class JsonGateDefinitionDefinitionRepositoryAdapter implements GateDefinitionRepositoryPort {

    private final ObjectMapper objectMapper;
    private final String gateDefinitionsFilePath; // Configurable path
    private List<GateDefinition> cachedGateDefinitions = Collections.emptyList();

    // Constructor Injection with property
    public JsonGateDefinitionDefinitionRepositoryAdapter(
            ObjectMapper objectMapper,
            @Value("${quak.library.gates-file:gatedefinitions.json}")
                    String gateDefinitionsFilePath) {
        this.objectMapper = objectMapper;
        this.gateDefinitionsFilePath = gateDefinitionsFilePath;
    }

    @PostConstruct
    public void init() {
        this.cachedGateDefinitions = loadGateDefinitionsFromJson();
    }

    @Override
    public List<GateDefinition> findAllGateDefinitions() {
        return Collections.unmodifiableList(cachedGateDefinitions);
    }

    @Override
    public Optional<GateDefinition> findGateDefinitionById(String id) {
        return cachedGateDefinitions.stream().filter(g -> g.id().equals(id)).findFirst();
    }

    private List<GateDefinition> loadGateDefinitionsFromJson() {
        try {
            ClassPathResource resource = new ClassPathResource(gateDefinitionsFilePath);
            if (!resource.exists()) {
                throw new IllegalStateException(
                        "Gate library file not found: " + gateDefinitionsFilePath);
            }

            try (InputStream is = resource.getInputStream()) {
                JsonGateDefinitionDto[] dtos =
                        objectMapper.readValue(is, JsonGateDefinitionDto[].class);
                return Arrays.stream(dtos)
                        .map(JsonGateDefinitionDto::toDomain)
                        .collect(Collectors.toList());
            }
        } catch (IOException e) {
            throw new IllegalStateException(
                    "Failed to parse gate library from " + gateDefinitionsFilePath, e);
        }
    }

    private record JsonGateDefinitionDto(
            @JsonProperty("id") String id,
            @JsonProperty("name") String name,
            @JsonProperty("symbol") String symbol,
            @JsonProperty("category") String category,
            @JsonProperty("description") String description,
            @JsonProperty("qubitCount") int qubitCount,
            @JsonProperty("parameters") List<String> parameters,
            @JsonProperty("inspectorInfo") JsonInspectorInfoDto inspectorInfo) {
        GateDefinition toDomain() {
            return new GateDefinition(
                    id,
                    name,
                    category,
                    description,
                    qubitCount,
                    symbol,
                    parameters != null ? parameters : Collections.emptyList(),
                    inspectorInfo != null ? inspectorInfo.toDomain() : null);
        }
    }

    private record JsonInspectorInfoDto(
            @JsonProperty("operatorDefinition") String operatorDefinition,
            @JsonProperty("truthTable") List<JsonTruthTableEntryDto> truthTable,
            @JsonProperty("matrix") JsonMatrixDto matrix) {
        GateDefinition.InspectorInfo toDomain() {
            return new GateDefinition.InspectorInfo(
                    operatorDefinition,
                    truthTable != null
                            ? truthTable.stream().map(JsonTruthTableEntryDto::toDomain).toList()
                            : Collections.emptyList(),
                    matrix != null ? matrix.toDomain() : null);
        }
    }

    private record JsonTruthTableEntryDto(
            @JsonProperty("input") String input, @JsonProperty("output") String output) {
        GateDefinition.TruthTableEntry toDomain() {
            return new GateDefinition.TruthTableEntry(input, output);
        }
    }

    private record JsonMatrixDto(
            @JsonProperty("display") String display,
            @JsonProperty("rows") int rows,
            @JsonProperty("cols") int cols,
            @JsonProperty("computable") List<List<String>> computable) {
        GateDefinition.MatrixInfo toDomain() {
            return new GateDefinition.MatrixInfo(display, rows, cols, computable);
        }
    }
}
