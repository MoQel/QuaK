package edu.kit.quak.infrastructure.user.in.web.rest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import edu.kit.quak.application.user.exceptions.AlreadyAuthenticatedException;
import edu.kit.quak.application.user.ports.in.GuestServicePort;
import edu.kit.quak.core.user.model.AuthenticatedUser;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.GlobalExceptionHandler;
import edu.kit.quak.infrastructure.user.in.web.rest.mapper.AuthenticationMapper;
import edu.kit.quak.infrastructure.user.in.web.security.GuestActivityFilter;
import edu.kit.quak.infrastructure.user.in.web.security.GuestAuthenticationToken;
import edu.kit.quak.infrastructure.user.in.web.security.GuestSessionAuthenticator;
import edu.kit.quak.infrastructure.user.in.web.security.GuestUpgradeSession;
import edu.kit.quak.shared.tags.IntegrationTest;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@IntegrationTest
@WebMvcTest(value = GuestAuthRestAdapter.class, properties = "app.guest.enabled=true")
@Import(
    {
        AuthenticationMapper.class,
        GuestSessionAuthenticator.class,
        GlobalExceptionHandler.class,
        GuestAuthRestAdapterTest.OpenSecurity.class,
    }
)
class GuestAuthRestAdapterTest {

    @TestConfiguration
    static class OpenSecurity {

        @Bean
        SecurityFilterChain chain(HttpSecurity http) throws Exception {
            return http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .build();
        }
    }

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    GuestServicePort guestService;

    @Test
    @DisplayName("POST /api/auth/guest creates a guest and reports it as authenticated guest")
    void createsGuest() throws Exception {
        User guest = User.createGuest();
        guest.setId(UUID.randomUUID());
        when(guestService.createGuest(any())).thenReturn(guest);

        mockMvc
            .perform(post("/api/auth/guest"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.authenticated").value(true))
            .andExpect(jsonPath("$.guest").value(true))
            .andExpect(jsonPath("$.userId").value(guest.getId().toString()));
    }

    @Test
    @DisplayName("POST /api/auth/guest stores the guest authentication in the session")
    void storesAuthenticationInSession() throws Exception {
        User guest = User.createGuest();
        guest.setId(UUID.randomUUID());
        when(guestService.createGuest(any())).thenReturn(guest);

        MockHttpSession session = (MockHttpSession) mockMvc.perform(post("/api/auth/guest")).andReturn().getRequest().getSession(false);

        assertNotNull(session);
        SecurityContext stored = (SecurityContext) session.getAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY);
        assertNotNull(stored);
        GuestAuthenticationToken token = assertInstanceOf(GuestAuthenticationToken.class, stored.getAuthentication());
        assertEquals(guest.getSub(), token.getPrincipal());
        assertEquals(guest.getLastActiveAt(), session.getAttribute(GuestActivityFilter.LAST_RECORDED_ATTRIBUTE));
    }

    @Test
    @WithMockUser
    @DisplayName("POST /api/auth/guest passes the current authentication to the service and reports its rejection")
    void rejectsSignedInCaller() throws Exception {
        when(guestService.createGuest(any())).thenThrow(new AlreadyAuthenticatedException("Already signed in"));

        mockMvc.perform(post("/api/auth/guest")).andExpect(status().isUnprocessableEntity());

        ArgumentCaptor<AuthenticatedUser> captor = ArgumentCaptor.forClass(AuthenticatedUser.class);
        verify(guestService).createGuest(captor.capture());
        assertNotNull(captor.getValue());
    }

    @Test
    @DisplayName("POST /api/auth/guest delegates exactly one creation per call")
    void createsOncePerCall() throws Exception {
        User guest = User.createGuest();
        guest.setId(UUID.randomUUID());
        when(guestService.createGuest(any())).thenReturn(guest);

        mockMvc.perform(post("/api/auth/guest")).andExpect(status().isOk());

        verify(guestService).createGuest(null);
    }

    @Test
    @DisplayName("POST /api/auth/guest/upgrade remembers the guest for the following OAuth2 login")
    void remembersGuestForUpgrade() throws Exception {
        MockHttpSession session = (MockHttpSession) mockMvc
            .perform(post("/api/auth/guest/upgrade").with(authentication(new GuestAuthenticationToken("guest-sub"))))
            .andExpect(status().isNoContent())
            .andReturn()
            .getRequest()
            .getSession(false);

        assertNotNull(session);
        assertEquals("guest-sub", GuestUpgradeSession.take(requestWith(session)).orElseThrow());
    }

    @Test
    @WithMockUser
    @DisplayName("POST /api/auth/guest/upgrade rejects callers that are not guests")
    void rejectsUpgradeOfNonGuest() throws Exception {
        mockMvc.perform(post("/api/auth/guest/upgrade")).andExpect(status().isUnprocessableEntity());
    }

    private static MockHttpServletRequest requestWith(MockHttpSession session) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setSession(session);
        return request;
    }
}
