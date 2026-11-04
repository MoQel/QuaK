package edu.kit.quak.application.user.dto;

/** Result of signing in with an OAuth2/OIDC account. */
public enum SignInOutcome {
    /** The account is signed in. */
    SIGNED_IN,
    /** The email belongs to an account of another provider, so the sign-in is rejected. */
    EMAIL_TAKEN,
    /** The account is signed in and has taken over the data of the guest that started the sign-in. */
    GUEST_UPGRADED,
    /** The email belongs to an account of another provider, so the guest stays a guest. */
    GUEST_UPGRADE_EMAIL_TAKEN,
    /** The account exists, but moving the guest's data failed, so the guest stays a guest. */
    GUEST_UPGRADE_FAILED,
}
