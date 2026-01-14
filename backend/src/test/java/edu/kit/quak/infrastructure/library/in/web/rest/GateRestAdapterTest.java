package edu.kit.quak.infrastructure.library.in.web.rest;

import edu.kit.quak.application.library.ports.in.GateServicePort;
import edu.kit.quak.core.library.model.Gate;
import edu.kit.quak.infrastructure.GlobalExceptionHandler;
import edu.kit.quak.infrastructure.library.in.web.rest.mapper.GateDtoMapperImpl;
import edu.kit.quak.shared.tags.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@IntegrationTest
@WebMvcTest(GateRestAdapter.class)
@Import({GateDtoMapperImpl.class, GlobalExceptionHandler.class})
@WithMockUser(username = "tester", roles = "USER")
class GateRestAdapterTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    GateServicePort gateService;

    @Test
    void getGate_returns200AndDto() throws Exception {
        // Arrange
        Gate gate = new Gate(
                "x",          // id
                "X",             // name
                "Pauli",         // type
                "Bit-Flip",      // description
                1,               // qubitCount
                "X",             // symbol
                List.of(),       // parameters
                null             // inspectorInfo
        );

        when(gateService.getGateById("x")).thenReturn(Optional.of(gate));

        // Act & Assert
        mockMvc.perform(get("/gates/x"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("x"))
                .andExpect(jsonPath("$.name").value("X"))
                .andExpect(jsonPath("$.symbol").value("X"));
    }

    @Test
    void getGate_returns200AndDtoWithInspectorInfo() throws Exception {
        // Arrange
        Gate.TruthTableEntry entry1 = new Gate.TruthTableEntry("|0\\rangle", "|1\\rangle");
        Gate.TruthTableEntry entry2 = new Gate.TruthTableEntry("|1\\rangle", "|0\\rangle");
        
        Gate.MatrixInfo matrixInfo = new Gate.MatrixInfo(
                "\\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}",
                2,
                2,
                List.of(List.of("0", "1"), List.of("1", "0"))
        );
        
        Gate.InspectorInfo inspectorInfo = new Gate.InspectorInfo(
                "X = |0\\rangle\\langle1| + |1\\rangle\\langle0|",
                List.of(entry1, entry2),
                matrixInfo
        );
        
        Gate gate = new Gate(
                "x",
                "X",
                "Pauli",
                "Bit-Flip",
                1,
                "X",
                List.of(),
                inspectorInfo
        );

        when(gateService.getGateById("x")).thenReturn(Optional.of(gate));

        // Act & Assert
        mockMvc.perform(get("/gates/x"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("x"))
                .andExpect(jsonPath("$.name").value("X"))
                .andExpect(jsonPath("$.symbol").value("X"))
                // Verify InspectorInfo structure
                .andExpect(jsonPath("$.inspectorInfo").exists())
                .andExpect(jsonPath("$.inspectorInfo.operatorDefinition").value("X = |0\\rangle\\langle1| + |1\\rangle\\langle0|"))
                // Verify TruthTable
                .andExpect(jsonPath("$.inspectorInfo.truthTable").isArray())
                .andExpect(jsonPath("$.inspectorInfo.truthTable[0].input").value("|0\\rangle"))
                .andExpect(jsonPath("$.inspectorInfo.truthTable[0].output").value("|1\\rangle"))
                .andExpect(jsonPath("$.inspectorInfo.truthTable[1].input").value("|1\\rangle"))
                .andExpect(jsonPath("$.inspectorInfo.truthTable[1].output").value("|0\\rangle"))
                // Verify MatrixInfo
                .andExpect(jsonPath("$.inspectorInfo.matrix").exists())
                .andExpect(jsonPath("$.inspectorInfo.matrix.display").value("\\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}"))
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
        when(gateService.getGateById("GibtsNicht")).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/gates/GibtsNicht"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Gate Not Found"));
    }
}