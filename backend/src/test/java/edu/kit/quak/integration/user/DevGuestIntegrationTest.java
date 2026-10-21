package edu.kit.quak.integration.user;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import edu.kit.quak.shared.tags.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@IntegrationTest
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class DevGuestIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void anonymousCallerCanSignInAsGuestAndStaysSignedIn() throws Exception {
        mockMvc
            .perform(get("/api/auth/user"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.authenticated").value(false))
            .andExpect(jsonPath("$.guestEnabled").value(true));

        MockHttpSession session = (MockHttpSession) mockMvc
            .perform(post("/api/auth/guest"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.authenticated").value(true))
            .andExpect(jsonPath("$.guest").value(true))
            .andReturn()
            .getRequest()
            .getSession(false);

        mockMvc
            .perform(get("/api/auth/user").session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.authenticated").value(true))
            .andExpect(jsonPath("$.guest").value(true));

        mockMvc.perform(get("/api/me").session(session)).andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Guest"));
    }
}
