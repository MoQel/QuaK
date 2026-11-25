package edu.kit.quak.application.user.services;

import edu.kit.quak.application.user.dto.SignInOutcome;
import edu.kit.quak.application.user.exceptions.DuplicateEmailException;
import edu.kit.quak.application.user.ports.in.GuestServicePort;
import edu.kit.quak.application.user.ports.in.OAuthSignInServicePort;
import edu.kit.quak.application.user.ports.in.OidcSyncServicePort;
import edu.kit.quak.application.user.ports.in.OidcUserInfo;
import edu.kit.quak.core.user.model.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Signs in OAuth2/OIDC accounts and upgrades guests. The account is synced and the guest's data is moved in
 * separate transactions, so a failed move leaves both the account and the guest untouched.
 */
@Service
@Slf4j
public class OAuthSignInService implements OAuthSignInServicePort {

    private final OidcSyncServicePort oidcSyncService;
    private final GuestServicePort guestService;

    public OAuthSignInService(OidcSyncServicePort oidcSyncService, GuestServicePort guestService) {
        this.oidcSyncService = oidcSyncService;
        this.guestService = guestService;
    }

    @Override
    public SignInOutcome signIn(String issuer, OidcUserInfo userInfo) {
        try {
            oidcSyncService.syncUser(issuer, userInfo);
            return SignInOutcome.SIGNED_IN;
        } catch (DuplicateEmailException e) {
            return SignInOutcome.EMAIL_TAKEN;
        }
    }

    @Override
    public SignInOutcome signInAndUpgradeGuest(String issuer, OidcUserInfo userInfo, String guestSubject) {
        User account;
        try {
            account = oidcSyncService.syncUser(issuer, userInfo);
        } catch (DuplicateEmailException e) {
            return SignInOutcome.GUEST_UPGRADE_EMAIL_TAKEN;
        }
        try {
            guestService.upgradeGuest(guestSubject, account.getId());
            return SignInOutcome.GUEST_UPGRADED;
        } catch (RuntimeException e) {
            log.error("Failed to upgrade guest '{}' to account '{}'", guestSubject, account.getId(), e);
            return SignInOutcome.GUEST_UPGRADE_FAILED;
        }
    }
}
