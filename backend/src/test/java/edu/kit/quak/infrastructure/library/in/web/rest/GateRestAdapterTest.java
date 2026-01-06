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
    void getGate_returns404_whenNotFound() throws Exception {
        // Arrange
        when(gateService.getGateById("GibtsNicht")).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/gates/GibtsNicht"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Gate Not Found"));
    }
}