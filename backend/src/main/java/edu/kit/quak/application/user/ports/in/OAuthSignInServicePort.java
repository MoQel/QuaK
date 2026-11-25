package edu.kit.quak.application.user.ports.in;

import edu.kit.quak.application.user.dto.SignInOutcome;

/** Input port for signing in with an OAuth2/OIDC account. */
public interface OAuthSignInServicePort {
    /**
     * Creates or updates the account of the signed-in user.
     *
     * @param issuer   The OAuth2/OIDC registration the user signed in with
     * @param userInfo The user's profile data from the provider
     * @return {@link SignInOutcome#SIGNED_IN} or {@link SignInOutcome#EMAIL_TAKEN}
     */
    SignInOutcome signIn(String issuer, OidcUserInfo userInfo);

    /**
     * Creates or updates the account of the signed-in user and moves the data of the guest that started the
     * sign-in to it.
     *
     * @param issuer       The OAuth2/OIDC registration the user signed in with
     * @param userInfo     The user's profile data from the provider
     * @param guestSubject The generated subject of the guest
     * @return {@link SignInOutcome#GUEST_UPGRADED}, {@link SignInOutcome#GUEST_UPGRADE_EMAIL_TAKEN} or
     *     {@link SignInOutcome#GUEST_UPGRADE_FAILED}
     */
    SignInOutcome signInAndUpgradeGuest(String issuer, OidcUserInfo userInfo, String guestSubject);
}
