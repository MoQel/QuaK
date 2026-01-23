package edu.kit.quak.infrastructure.library.in.web.rest;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import edu.kit.quak.application.library.ports.in.GateDefinitionServicePort;
import edu.kit.quak.core.library.model.GateDefinition;
import edu.kit.quak.infrastructure.GlobalExceptionHandler;
import edu.kit.quak.infrastructure.library.in.web.rest.mapper.GateDefinitionDtoMapperImpl;
import edu.kit.quak.shared.tags.IntegrationTest;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@IntegrationTest
@WebMvcTest(GateDefinitionRestAdapter.class)
@Import({GateDefinitionDtoMapperImpl.class, GlobalExceptionHandler.class})
@WithMockUser(username = "tester", roles = "USER")
class GateDefinitionDefinitionRestAdapterTest {

    @Autowired MockMvc mockMvc;

    @MockitoBean GateDefinitionServicePort gateService;

    @Test
    void getGate_returns200AndDto() throws Exception {
        // Arrange
        GateDefinition gateDefinition =
                new GateDefinition(
                        "x", // id
                        "X", // name
                        "Pauli", // category
                        "Bit-Flip", // description
                        1, // qubitCount
                        "X", // symbol
                        List.of(), // parameters
                        null // inspectorInfo
                        );

        when(gateService.getGateDefinitionById("x")).thenReturn(Optional.of(gateDefinition));

        // Act & Assert
        mockMvc.perform(get("/api/gates/x"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("x"))
                .andExpect(jsonPath("$.name").value("X"))
                .andExpect(jsonPath("$.symbol").value("X"));
    }

    @Test
    void getGate_returns200AndDtoWithInspectorInfo() throws Exception {
        // Arrange
        GateDefinition.TruthTableEntry entry1 =
                new GateDefinition.TruthTableEntry("|0\\rangle", "|1\\rangle");
        GateDefinition.TruthTableEntry entry2 =
                new GateDefinition.TruthTableEntry("|1\\rangle", "|0\\rangle");

        GateDefinition.MatrixInfo matrixInfo =
                new GateDefinition.MatrixInfo(
                        "\\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}",
                        2,
                        2,
                        List.of(List.of("0", "1"), List.of("1", "0")));

        GateDefinition.InspectorInfo inspectorInfo =
                new GateDefinition.InspectorInfo(
                        "X = |0\\rangle\\langle1| + |1\\rangle\\langle0|",
                        List.of(entry1, entry2),
                        matrixInfo);

        GateDefinition gateDefinition =
                new GateDefinition("x", "X", "Pauli", "Bit-Flip", 1, "X", List.of(), inspectorInfo);

        when(gateService.getGateDefinitionById("x")).thenReturn(Optional.of(gateDefinition));

        // Act & Assert
        mockMvc.perform(get("/api/gates/x"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("x"))
                .andExpect(jsonPath("$.name").value("X"))
                .andExpect(jsonPath("$.symbol").value("X"))
                // Verify InspectorInfo structure
                .andExpect(jsonPath("$.inspectorInfo").exists())
                .andExpect(
                        jsonPath("$.inspectorInfo.operatorDefinition")
                                .value("X = |0\\rangle\\langle1| + |1\\rangle\\langle0|"))
                // Verify TruthTable
                .andExpect(jsonPath("$.inspectorInfo.truthTable").isArray())
                .andExpect(jsonPath("$.inspectorInfo.truthTable[0].input").value("|0\\rangle"))
                .andExpect(jsonPath("$.inspectorInfo.truthTable[0].output").value("|1\\rangle"))
                .andExpect(jsonPath("$.inspectorInfo.truthTable[1].input").value("|1\\rangle"))
                .andExpect(jsonPath("$.inspectorInfo.truthTable[1].output").value("|0\\rangle"))
                // Verify MatrixInfo
                .andExpect(jsonPath("$.inspectorInfo.matrix").exists())
                .andExpect(
                        jsonPath("$.inspectorInfo.matrix.display")
                                .value("\\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}"))
                .andExpect(jsonPath("$.inspectorInfo.matrix.rows").value(2))
                .andExpect(jsonPath("$.inspectorInfo.matrix.cols").value(2))
                .andExpect(jsonPath("$.inspectorInfo.matrix.computable").isArray())
                .andExpect(jsonPath("$.inspectorInfo.matrix.computable[0][0]").value("0"))
                .andExpect(jsonPath("$.inspectorInfo.matrix.computable[0][1]").value("1"))
                .andExpect(jsonPath("$.inspectorInfo.matrix.computable[1][0]").value("1"))
                .andExpect(jsonPath("$.inspectorInfo.matrix.computable[1][1]").value("0"));
    }

    @Test
    void getGate_returns404_whenNotFound() throws Exception {
        // Arrange
        when(gateService.getGateDefinitionById("GibtsNicht")).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/gates/GibtsNicht"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Gate Not Found"));
    }
}
