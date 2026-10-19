package edu.kit.quak.infrastructure.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import edu.kit.quak.application.user.ports.in.OidcUserInfo;
import edu.kit.quak.shared.tags.UnitTest;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;

@UnitTest
class OAuth2UserInfoMapperTest {

    @Test
    @DisplayName("an OIDC user maps sub, picture and its email verification")
    void mapsOidcAttributes() {
        OidcUserInfo info = OAuth2UserInfoMapper.toUserInfo(
            user(Map.of("sub", "abc", "picture", "https://pic", "email_verified", false, "email", "a@b.c"), "sub")
        );

        assertEquals("abc", info.sub());
        assertEquals("https://pic", info.picture());
        assertEquals("a@b.c", info.email());
        assertFalse(info.emailVerified());
    }

    @Test
    @DisplayName("a GitHub user falls back to id and avatar_url and counts as verified")
    void mapsGithubAttributes() {
        OidcUserInfo info = OAuth2UserInfoMapper.toUserInfo(user(Map.of("id", 42, "avatar_url", "https://avatar"), "id"));

        assertEquals("42", info.sub());
        assertEquals("https://avatar", info.picture());
        assertTrue(info.emailVerified());
        assertNull(info.email());
    }

    private static OAuth2User user(Map<String, Object> attributes, String nameAttribute) {
        return new DefaultOAuth2User(AuthorityUtils.createAuthorityList("ROLE_USER"), attributes, nameAttribute);
    }
}
