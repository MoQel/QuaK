package edu.kit.quak.infrastructure.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import edu.kit.quak.shared.tags.UnitTest;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@UnitTest
class SinglePageApplicationControllerTest {

    private final MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new SinglePageApplicationController()).build();

    @ParameterizedTest
    @ValueSource(strings = { "/login", "/project/p-88f7eea0-636b-4227-b88e-fda613b72302", "/profile", "/settings" })
    void browserHistoryRoutesForwardToTheApplicationShell(String route) throws Exception {
        mockMvc.perform(get(route)).andExpect(status().isOk()).andExpect(forwardedUrl("/index.html"));
    }
}
