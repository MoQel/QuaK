package edu.kit.quak.infrastructure.user.out.db.jpa.entity;

import edu.kit.quak.core.user.model.ProjectRole;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** JPA entity for project role assignment persistence. */
@Entity
@Table(name = "project_role_assignments", uniqueConstraints = { @UniqueConstraint(columnNames = { "user_id", "project_id" }) })
@Getter
@Setter
@NoArgsConstructor
public class JpaProjectRoleAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private java.util.UUID userId;

    @Column(name = "project_id", nullable = false)
    private String projectId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProjectRole role;
}
