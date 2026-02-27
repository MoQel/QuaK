package edu.kit.quak.infrastructure.library.out.json;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.kit.quak.application.library.ports.out.OperationDefinitionRepositoryPort;
import edu.kit.quak.core.library.model.OperationDefinition;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Repository;

@Repository
public class JsonOperationDefinitionRepositoryAdapter implements OperationDefinitionRepositoryPort {

    private final ObjectMapper objectMapper;
    private final String operationDefinitionsFilePath; // Configurable path
    private List<OperationDefinition> cachedOperationDefinitions = Collections.emptyList();

    // Constructor Injection with property
    public JsonOperationDefinitionRepositoryAdapter(
        ObjectMapper objectMapper,
        @Value("${quak.library.operation-definitions-file:operation-definitions.json}") String operationDefinitionsFilePath
    ) {
        this.objectMapper = objectMapper;
        this.operationDefinitionsFilePath = operationDefinitionsFilePath;
    }

    @PostConstruct
    public void init() {
        this.cachedOperationDefinitions = loadOperationDefinitionsFromJson();
    }

    @Override
    public List<OperationDefinition> findAllOperationDefinitions() {
        return Collections.unmodifiableList(cachedOperationDefinitions);
    }

    @Override
    public Optional<OperationDefinition> findOperationDefinitionById(String id) {
        return cachedOperationDefinitions
            .stream()
            .filter(g -> g.id().equals(id))
            .findFirst();
    }

    private List<OperationDefinition> loadOperationDefinitionsFromJson() {
        try {
            ClassPathResource resource = new ClassPathResource(operationDefinitionsFilePath);
            if (!resource.exists()) {
                throw new IllegalStateException("Operation definitions file not found: " + operationDefinitionsFilePath);
            }

            try (InputStream is = resource.getInputStream()) {
                JsonOperationDefinitionDto[] dtos = objectMapper.readValue(is, JsonOperationDefinitionDto[].class);
                return Arrays.stream(dtos).map(JsonOperationDefinitionDto::toDomain).toList();
            }
        } catch (IOException e) {
            throw new IllegalStateException("Failed to parse operation definitions file from " + operationDefinitionsFilePath, e);
        }
    }

    private record JsonOperationDefinitionDto(
        @JsonProperty("id") String id,
        @JsonProperty("name") String name,
        @JsonProperty("symbol") String symbol,
        @JsonProperty("category") String category,
        @JsonProperty("description") String description,
        @JsonProperty("qubitCount") int qubitCount,
        @JsonProperty("parameters") List<String> parameters,
        @JsonProperty("inspectorInfo") JsonInspectorInfoDto inspectorInfo
    ) {
        OperationDefinition toDomain() {
            return new OperationDefinition(
                id,
                name,
                category,
                description,
                qubitCount,
                symbol,
                parameters != null ? parameters : Collections.emptyList(),
                inspectorInfo != null ? inspectorInfo.toDomain() : null
            );
        }
    }

    private record JsonInspectorInfoDto(
        @JsonProperty("operatorDefinition") String operatorDefinition,
        @JsonProperty("truthTable") List<JsonTruthTableEntryDto> truthTable,
        @JsonProperty("matrix") JsonMatrixDto matrix
    ) {
        OperationDefinition.InspectorInfo toDomain() {
            return new OperationDefinition.InspectorInfo(
                operatorDefinition,
                truthTable != null ? truthTable.stream().map(JsonTruthTableEntryDto::toDomain).toList() : Collections.emptyList(),
                matrix != null ? matrix.toDomain() : null
            );
        }
    }

    private record JsonTruthTableEntryDto(@JsonProperty("input") String input, @JsonProperty("output") String output) {
        OperationDefinition.TruthTableEntry toDomain() {
            return new OperationDefinition.TruthTableEntry(input, output);
        }
    }

    private record JsonMatrixDto(
        @JsonProperty("display") String display,
        @JsonProperty("rows") int rows,
        @JsonProperty("cols") int cols,
        @JsonProperty("computable") List<List<String>> computable
    ) {
        OperationDefinition.MatrixInfo toDomain() {
            return new OperationDefinition.MatrixInfo(display, rows, cols, computable);
        }
    }
}
