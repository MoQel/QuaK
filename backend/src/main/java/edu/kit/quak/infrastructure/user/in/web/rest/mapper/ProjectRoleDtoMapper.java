package edu.kit.quak.infrastructure.user.in.web.rest.mapper;

import edu.kit.quak.application.user.ports.in.UserServicePort;
import edu.kit.quak.core.user.model.ProjectRoleAssignment;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.user.in.web.rest.dto.ProjectRoleResponse;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Mapper for converting between domain ProjectRoleAssignment and REST DTOs.
 * Handles the
 * enum-to-string conversion for the role field.
 */
@Component
public class ProjectRoleDtoMapper {
    private final UserServicePort userService;

    public ProjectRoleDtoMapper(UserServicePort userService) {
        this.userService = userService;
    }

    public ProjectRoleResponse toResponse(ProjectRoleAssignment assignment) {
        User user = userService.findById(assignment.getUserId()).orElse(null);
        return new ProjectRoleResponse(
                assignment.getUserId(),
                assignment.getProjectId(),
                assignment.getRole().name(),
                user != null ? user.getEmail() : null,
                user != null ? user.getName() : null,
                user != null ? user.getAvatarUrl() : null);
    }

    public List<ProjectRoleResponse> toResponseList(List<ProjectRoleAssignment> assignments) {
        return assignments.stream().map(this::toResponse).toList();
    }
}
