package edu.kit.quak.application.user.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import edu.kit.quak.application.user.ports.out.ProjectRoleRepositoryPort;
import edu.kit.quak.core.user.model.ProjectRole;
import edu.kit.quak.core.user.model.ProjectRoleAssignment;
import edu.kit.quak.shared.tags.UnitTest;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@UnitTest
@ExtendWith(MockitoExtension.class)
class ProjectRoleServiceTransferTest {

    private final UUID from = UUID.randomUUID();
    private final UUID to = UUID.randomUUID();

    @Mock
    ProjectRoleRepositoryPort roleRepository;

    @InjectMocks
    ProjectRoleService roleService;

    @Test
    @DisplayName("moves an assignment to the receiving user")
    void movesAssignment() {
        ProjectRoleAssignment owner = new ProjectRoleAssignment(from, "p-1", ProjectRole.OWNER);
        when(roleRepository.findAllByUserId(from)).thenReturn(List.of(owner));
        when(roleRepository.findByUserIdAndProjectId(to, "p-1")).thenReturn(Optional.empty());

        roleService.transferAllByUserId(from, to);

        assertEquals(to, owner.getUserId());
        verify(roleRepository).save(owner);
    }

    @Test
    @DisplayName("keeps the higher role when the receiving user already has one on the project")
    void keepsHigherRole() {
        ProjectRoleAssignment owner = new ProjectRoleAssignment(from, "p-1", ProjectRole.OWNER);
        ProjectRoleAssignment viewer = new ProjectRoleAssignment(to, "p-1", ProjectRole.VIEWER);
        when(roleRepository.findAllByUserId(from)).thenReturn(List.of(owner));
        when(roleRepository.findByUserIdAndProjectId(to, "p-1")).thenReturn(Optional.of(viewer));

        roleService.transferAllByUserId(from, to);

        assertEquals(ProjectRole.OWNER, viewer.getRole());
        verify(roleRepository).save(viewer);
        verify(roleRepository).deleteByUserIdAndProjectId(from, "p-1");
        verify(roleRepository, never()).save(owner);
    }
}
