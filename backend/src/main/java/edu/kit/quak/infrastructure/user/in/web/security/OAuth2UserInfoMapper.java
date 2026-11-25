package edu.kit.quak.infrastructure.user.in.web.security;

import edu.kit.quak.application.user.ports.in.OidcUserInfo;
import org.springframework.security.oauth2.core.user.OAuth2User;

/** Maps the attributes of an OAuth2 or OIDC principal to {@link OidcUserInfo}. */
public final class OAuth2UserInfoMapper {

    private OAuth2UserInfoMapper() {}

    public static OidcUserInfo toUserInfo(OAuth2User principal) {
        // Providers differ in attribute names: GitHub uses "id" and "avatar_url", OIDC providers use "sub" and "picture"
        return new OidcUserInfo(
            firstAttribute(principal, "sub", "id"),
            principal.getAttribute("email"),
            !Boolean.FALSE.equals(principal.getAttribute("email_verified")),
            principal.getAttribute("name"),
            principal.getAttribute("given_name"),
            principal.getAttribute("family_name"),
            firstAttribute(principal, "picture", "avatar_url")
        );
    }

    private static String firstAttribute(OAuth2User principal, String... names) {
        for (String name : names) {
            Object value = principal.getAttribute(name);
            if (value != null) {
                return value.toString();
            }
        }
        return null;
    }
}
