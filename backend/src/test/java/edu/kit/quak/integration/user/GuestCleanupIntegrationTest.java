package edu.kit.quak.integration.user;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import edu.kit.quak.application.editorstate.ports.in.EditorStateServicePort;
import edu.kit.quak.application.filesystem.ports.in.ProjectServicePort;
import edu.kit.quak.application.user.ports.in.GuestServicePort;
import edu.kit.quak.application.user.ports.out.ProjectRoleRepositoryPort;
import edu.kit.quak.application.user.ports.out.UserRepositoryPort;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.editorstate.out.db.jpa.repository.SpringDataJpaEditorStateRepository;
import edu.kit.quak.infrastructure.user.out.db.jpa.repository.SpringDataUserRepository;
import edu.kit.quak.shared.tags.IntegrationTest;
import jakarta.persistence.EntityManager;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@SpringBootTest
@Transactional
class GuestCleanupIntegrationTest {

    @Autowired
    GuestServicePort guestService;

    @Autowired
    ProjectServicePort projectService;

    @Autowired
    EditorStateServicePort editorStateService;

    @Autowired
    UserRepositoryPort userRepository;

    @Autowired
    ProjectRoleRepositoryPort roleRepository;

    @Autowired
    SpringDataUserRepository jpaUserRepository;

    @Autowired
    SpringDataJpaEditorStateRepository editorStateRepository;

    @Autowired
    EntityManager entityManager;

    @Test
    @DisplayName("deleting an inactive guest removes its projects, roles and editor states")
    void deletesInactiveGuestWithItsData() {
        User guest = guestService.createGuest(null);
        Project project = projectService.createProject(new Project("Demo"), guest);
        editorStateService.save(project.getId(), "[]", guest);
        markInactiveSince(guest, Instant.now().minus(Duration.ofHours(3)));

        int deleted = guestService.deleteInactiveGuests(Instant.now().minus(Duration.ofHours(2)));

        assertEquals(1, deleted);
        assertTrue(userRepository.findById(guest.getId()).isEmpty());
        assertTrue(projectService.listProjects(guest).isEmpty());
        assertTrue(roleRepository.findAllByUserId(guest.getId()).isEmpty());
        assertTrue(editorStateRepository.findByProjectIdAndUserId(project.getId(), guest.getId().toString()).isEmpty());
    }

    @Test
    @DisplayName("keeps guests that were active recently")
    void keepsActiveGuest() {
        User guest = guestService.createGuest(null);

        int deleted = guestService.deleteInactiveGuests(Instant.now().minus(Duration.ofHours(2)));

        assertEquals(0, deleted);
        assertTrue(userRepository.findById(guest.getId()).isPresent());
    }

    private void markInactiveSince(User guest, Instant lastActiveAt) {
        jpaUserRepository
            .findById(guest.getId())
            .ifPresent(jpaUser -> {
                jpaUser.setLastActiveAt(lastActiveAt);
                jpaUserRepository.saveAndFlush(jpaUser);
            });
        entityManager.clear();
    }
}
