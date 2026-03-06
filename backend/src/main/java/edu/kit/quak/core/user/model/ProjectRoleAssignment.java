package edu.kit.quak.core.user.model;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Domain POJO representing the assignment of a {@link ProjectRole} to a user
 * for a specific
 * project. This is a pure POJO with no infrastructure dependencies.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProjectRoleAssignment {

    private Long id;

    /** The UUID of the user who holds this role. */
    private UUID userId;

    /** The ID of the project this role applies to. */
    private String projectId;

    /** The role assigned to the user for the project. */
    private ProjectRole role;

    /**
     * Creates a new role assignment without a persistence ID.
     *
     * @param userId    the user's UUID
     * @param projectId the project's ID
     * @param role      the role to assign
     */
    public ProjectRoleAssignment(UUID userId, String projectId, ProjectRole role) {
        this.userId = userId;
        this.projectId = projectId;
        this.role = role;
    }
}
