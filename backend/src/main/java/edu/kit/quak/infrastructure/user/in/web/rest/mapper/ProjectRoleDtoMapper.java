package edu.kit.quak.infrastructure.user.in.web.rest.mapper;

import edu.kit.quak.core.user.model.ProjectRoleAssignment;
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

    public ProjectRoleResponse toResponse(ProjectRoleAssignment assignment) {
        return new ProjectRoleResponse(
                assignment.getUserId(),
                assignment.getProjectId(),
                assignment.getRole().name());
    }

    public List<ProjectRoleResponse> toResponseList(List<ProjectRoleAssignment> assignments) {
        return assignments.stream().map(this::toResponse).toList();
    }
}
