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

import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
        Gate gate = new Gate("X", "Pauli-X", "Bit-Flip", 1, Gate.SYMBOL.X);
        when(gateService.getGateByName("X")).thenReturn(Optional.of(gate));

        // Act & Assert
        mockMvc.perform(get("/gates/X"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("X"))
                .andExpect(jsonPath("$.symbol").value("X"));
    }

    @Test
    void getGate_returns404_whenNotFound() throws Exception {
        // Arrange
        when(gateService.getGateByName("GibtsNicht")).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/gates/GibtsNicht"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Gate Not Found"));
    }
}