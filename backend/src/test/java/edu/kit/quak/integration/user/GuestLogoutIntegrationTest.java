package edu.kit.quak.integration.user;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.repository.SpringDataProjectRepository;
import edu.kit.quak.infrastructure.user.out.db.jpa.repository.SpringDataUserRepository;
import edu.kit.quak.shared.tags.IntegrationTest;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@IntegrationTest
@SpringBootTest
@AutoConfigureMockMvc
class GuestLogoutIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private SpringDataUserRepository userRepository;

    @Autowired
    private SpringDataProjectRepository projectRepository;

    @Test
    void loggingOutDeletesTheGuestWithItsProjects() throws Exception {
        MvcResult signIn = mockMvc.perform(post("/api/auth/guest")).andExpect(status().isOk()).andReturn();
        MockHttpSession session = (MockHttpSession) signIn.getRequest().getSession(false);
        UUID guestId = UUID.fromString(objectMapper.readTree(signIn.getResponse().getContentAsString()).path("userId").asText());
        String projectId = createProject(session);

        mockMvc.perform(post("/api/auth/logout").session(session).with(csrf())).andExpect(status().isOk());

        assertTrue(userRepository.findById(guestId).isEmpty());
        assertTrue(projectRepository.findById(projectId).isEmpty());
    }

    private String createProject(MockHttpSession session) throws Exception {
        String body = mockMvc
            .perform(
                post("/api/project")
                    .session(session)
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.createObjectNode().put("name", "Guest demo").toString())
            )
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
        return objectMapper.readTree(body).path("id").asText();
    }
}
