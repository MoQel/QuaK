package edu.kit.quak.integration.user;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import edu.kit.quak.application.editorstate.ports.in.EditorStateServicePort;
import edu.kit.quak.application.filesystem.ports.in.ProjectServicePort;
import edu.kit.quak.application.user.ports.in.GuestServicePort;
import edu.kit.quak.application.user.ports.in.ProjectRoleServicePort;
import edu.kit.quak.application.user.ports.out.UserRepositoryPort;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.core.user.model.ProjectRole;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.core.user.model.UserProfile;
import edu.kit.quak.shared.tags.IntegrationTest;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@SpringBootTest
@Transactional
class GuestUpgradeIntegrationTest {

    @Autowired
    GuestServicePort guestService;

    @Autowired
    ProjectServicePort projectService;

    @Autowired
    EditorStateServicePort editorStateService;

    @Autowired
    ProjectRoleServicePort roleService;

    @Autowired
    UserRepositoryPort userRepository;

    @Test
    @DisplayName("upgrading a guest moves its projects, roles and editor states to the account")
    void movesGuestDataToAccount() {
        User account = userRepository.save(
            User.createFromOidc("google", "upgrade-" + UUID.randomUUID(), new UserProfile(null, true, "Ada", null, null, null))
        );
        projectService.createProject(new Project("Demo"), account);
        User guest = guestService.createGuest(null);
        Project guestProject = projectService.createProject(new Project("Demo"), guest);
        editorStateService.save(guestProject.getId(), "[]", guest);

        guestService.upgradeGuest(guest.getSub(), account.getId());

        assertTrue(userRepository.findById(guest.getId()).isEmpty());
        List<String> names = projectService.listProjects(account).stream().map(Project::getName).sorted().toList();
        assertEquals(List.of("Demo", "Demo (2)"), names);
        assertEquals(ProjectRole.OWNER, roleService.getUserRoleForProject(guestProject.getId(), account.getId()));
        assertTrue(editorStateService.getByProjectId(guestProject.getId(), account).isPresent());
    }

    @Test
    @DisplayName("a new account takes over the guest's projects under their names")
    void newAccountKeepsNames() {
        User account = account();
        User guest = guestService.createGuest(null);
        projectService.createProject(new Project("Demo"), guest);

        guestService.upgradeGuest(guest.getSub(), account.getId());

        assertEquals(List.of("Demo"), projectNames(account));
    }

    @Test
    @DisplayName("numbering skips names the guest keeps itself")
    void numberingSkipsNamesOfOtherGuestProjects() {
        User account = account();
        projectService.createProject(new Project("Demo"), account);
        User guest = guestService.createGuest(null);
        projectService.createProject(new Project("Demo"), guest);
        projectService.createProject(new Project("Demo (2)"), guest);

        guestService.upgradeGuest(guest.getSub(), account.getId());

        assertEquals(List.of("Demo", "Demo (2)", "Demo (3)"), projectNames(account));
    }

    @Test
    @DisplayName("a project the guest shared with the receiving account ends up owned once")
    void sharedProjectBecomesOwnedByViewer() {
        User account = account();
        User guest = guestService.createGuest(null);
        Project shared = projectService.createProject(new Project("Shared"), guest);
        roleService.assignRole(shared.getId(), account.getId(), ProjectRole.VIEWER, guest);
        editorStateService.save(shared.getId(), "[\"guest\"]", guest);
        editorStateService.save(shared.getId(), "[\"account\"]", account);

        guestService.upgradeGuest(guest.getSub(), account.getId());

        assertEquals(List.of("Shared"), projectNames(account));
        assertEquals(ProjectRole.OWNER, roleService.getUserRoleForProject(shared.getId(), account.getId()));
        assertEquals("[\"account\"]", editorStateService.getByProjectId(shared.getId(), account).orElseThrow().getTabsJson());
    }

    @Test
    @DisplayName("a project the guest shared with someone else stays shared after the upgrade")
    void sharedProjectStaysSharedWithOthers() {
        User account = account();
        User viewer = account();
        User guest = guestService.createGuest(null);
        Project shared = projectService.createProject(new Project("Shared"), guest);
        roleService.assignRole(shared.getId(), viewer.getId(), ProjectRole.VIEWER, guest);

        guestService.upgradeGuest(guest.getSub(), account.getId());

        assertEquals(ProjectRole.OWNER, roleService.getUserRoleForProject(shared.getId(), account.getId()));
        assertEquals(ProjectRole.VIEWER, roleService.getUserRoleForProject(shared.getId(), viewer.getId()));
    }

    private User account() {
        return userRepository.save(
            User.createFromOidc("google", "upgrade-" + UUID.randomUUID(), new UserProfile(null, true, "Ada", null, null, null))
        );
    }

    private List<String> projectNames(User owner) {
        return projectService.listProjects(owner).stream().map(Project::getName).sorted().toList();
    }
}
