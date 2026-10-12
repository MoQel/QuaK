package edu.kit.quak.infrastructure.user.in.web.rest.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import edu.kit.quak.application.user.dto.AuthStatusResponse;
import edu.kit.quak.application.user.exceptions.UserNotFoundException;
import edu.kit.quak.core.user.model.AuthenticatedUser;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.user.in.web.rest.dto.RestAuthStatusResponse;
import edu.kit.quak.infrastructure.user.in.web.security.GuestAuthenticationToken;
import edu.kit.quak.shared.tags.UnitTest;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;

@UnitTest
class AuthenticationMapperTest {

    private final AuthenticationMapper mapper = new AuthenticationMapper();

    @Test
    @DisplayName("a guest token maps to the guest issuer and its subject")
    void mapsGuestToken() {
        AuthenticatedUser result = mapper.toDomain(new GuestAuthenticationToken("abc"));

        assertEquals(User.GUEST_ISSUER, result.issuer());
        assertEquals("abc", result.subject());
    }

    @Test
    @DisplayName("a signed-in authentication maps to a user, anonymous and missing ones to empty")
    void mapsOnlySignedInAuthentication() {
        assertEquals(User.GUEST_ISSUER, mapper.toDomainIfAuthenticated(new GuestAuthenticationToken("abc")).orElseThrow().issuer());
        assertTrue(mapper.toDomainIfAuthenticated(null).isEmpty());
        assertTrue(
            mapper
                .toDomainIfAuthenticated(
                    new AnonymousAuthenticationToken("key", "anonymousUser", AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS"))
                )
                .isEmpty()
        );
    }

    @Test
    @DisplayName("a user maps to a signed-in status carrying its guest flag")
    void userMapsToSignedInStatus() {
        User guest = User.createGuest();
        guest.setId(UUID.randomUUID());

        RestAuthStatusResponse response = mapper.toRestResponse(guest);

        assertTrue(response.authenticated());
        assertTrue(response.guest());
        assertEquals(guest.getId(), response.userId());
    }

    @Test
    @DisplayName("the status response carries the guest flag of the user")
    void statusResponseCarriesGuestFlag() {
        User guest = User.createGuest();
        guest.setId(UUID.randomUUID());
        User regular = new User(UUID.randomUUID(), "github", "x");

        RestAuthStatusResponse guestResponse = mapper.toRestResponse(new AuthStatusResponse(true, guest));
        RestAuthStatusResponse regularResponse = mapper.toRestResponse(new AuthStatusResponse(true, regular));
        RestAuthStatusResponse anonymous = mapper.toRestResponse(new AuthStatusResponse(false, null));

        assertTrue(guestResponse.guest());
        assertFalse(regularResponse.guest());
        assertFalse(anonymous.guest());
    }

    @Test
    @DisplayName("a missing or unsupported authentication is rejected")
    void rejectsMissingAndUnsupported() {
        AnonymousAuthenticationToken anonymous = new AnonymousAuthenticationToken(
            "key",
            "anonymousUser",
            AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS")
        );

        assertThrows(UserNotFoundException.class, () -> mapper.toDomain(null));
        assertThrows(UserNotFoundException.class, () -> mapper.toDomain(anonymous));
    }

    @Test
    @DisplayName("an OAuth2 user falls back to id when sub is missing and is rejected when both are missing")
    void mapsOAuthSubject() {
        OAuth2AuthenticationToken github = oauthToken("github", Map.of("id", 42, "name", "x"), "id");
        OAuth2AuthenticationToken google = oauthToken("google", Map.of("sub", "abc"), "sub");
        OAuth2AuthenticationToken neither = oauthToken("github", Map.of("login", "x"), "login");

        assertEquals("42", mapper.toDomain(github).subject());
        assertEquals("abc", mapper.toDomain(google).subject());
        assertThrows(UserNotFoundException.class, () -> mapper.toDomain(neither));
    }

    private static OAuth2AuthenticationToken oauthToken(String registrationId, Map<String, Object> attributes, String nameAttribute) {
        OAuth2User user = new DefaultOAuth2User(AuthorityUtils.createAuthorityList("ROLE_USER"), attributes, nameAttribute);
        return new OAuth2AuthenticationToken(user, user.getAuthorities(), registrationId);
    }
}
