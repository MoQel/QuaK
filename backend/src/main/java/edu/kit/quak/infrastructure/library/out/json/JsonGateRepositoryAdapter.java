package edu.kit.quak.infrastructure.library.out.json;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.kit.quak.application.library.ports.out.GateRepositoryPort;
import edu.kit.quak.core.library.model.Gate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Repository;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class JsonGateRepositoryAdapter implements GateRepositoryPort {

    private final ObjectMapper objectMapper;
    private final String gatesFilePath; // Configurable path
    private List<Gate> cachedGates = Collections.emptyList();

    // Constructor Injection with property
    public JsonGateRepositoryAdapter(ObjectMapper objectMapper,
                                     @Value("${quak.library.gates-file:gates.json}") String gatesFilePath) {
        this.objectMapper = objectMapper;
        this.gatesFilePath = gatesFilePath;
    }

    @PostConstruct
    public void init() {
        this.cachedGates = loadGatesFromJson();
    }

    @Override
    public List<Gate> findAllGates() {
        return Collections.unmodifiableList(cachedGates);
    }

    @Override
    public Optional<Gate> findGateById(String id) {
        return cachedGates.stream()
                .filter(g -> g.id().equals(id))
                .findFirst();
    }

    private List<Gate> loadGatesFromJson() {
        try {
            ClassPathResource resource = new ClassPathResource(gatesFilePath);
            if (!resource.exists()) {
                throw new IllegalStateException("Gate library file not found: " + gatesFilePath);
            }

            try (InputStream is = resource.getInputStream()) {
                JsonGateDto[] dtos = objectMapper.readValue(is, JsonGateDto[].class);
                return Arrays.stream(dtos)
                        .map(JsonGateDto::toDomain)
                        .collect(Collectors.toList());
            }
        } catch (IOException e) {
            throw new IllegalStateException("Failed to parse gate library from " + gatesFilePath, e);
        }
    }

    private record JsonGateDto(
            @JsonProperty("id") String id,
            @JsonProperty("name") String name,
            @JsonProperty("symbol") String symbol,
            @JsonProperty("type") String type,
            @JsonProperty("description") String description,
            @JsonProperty("qubitCount") int qubitCount,
            @JsonProperty("parameters") List<String> parameters,
            @JsonProperty("inspectorInfo") JsonInspectorInfoDto inspectorInfo
    ) {
        Gate toDomain() {
            return new Gate(
                    id,
                    name,
                    type,
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
        Gate.InspectorInfo toDomain() {
            return new Gate.InspectorInfo(
                    operatorDefinition,
                    truthTable != null ? truthTable.stream()
                            .map(JsonTruthTableEntryDto::toDomain)
                            .toList() : Collections.emptyList(),
                    matrix != null ? matrix.toDomain() : null
            );
        }
    }

    private record JsonTruthTableEntryDto(
            @JsonProperty("input") String input,
            @JsonProperty("output") String output
    ) {
        Gate.TruthTableEntry toDomain() {
            return new Gate.TruthTableEntry(input, output);
        }
    }

    private record JsonMatrixDto(
            @JsonProperty("display") String display,
            @JsonProperty("rows") int rows,
            @JsonProperty("cols") int cols,
            @JsonProperty("computable") List<List<String>> computable
    ) {
        Gate.MatrixInfo toDomain() {
            return new Gate.MatrixInfo(display, rows, cols, computable);
        }
    }
}