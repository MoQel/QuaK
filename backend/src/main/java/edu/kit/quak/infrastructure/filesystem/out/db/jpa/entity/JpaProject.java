package edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@DiscriminatorValue("project")
@Getter
@Setter
public class JpaProject extends JpaFileElementContainer<JpaProject> {

    /**
     * The UUID of the user who owns this project. We store only the ID to avoid coupling filesystem
     * entities with user entities.
     */
    @Column(name = "owner_id")
    private UUID ownerId;

    public JpaProject() {
        super();
    }

    public JpaProject(String name) {
        super(name, null);
    }

    public JpaProject(String name, UUID ownerId) {
        super(name, null);
        this.ownerId = ownerId;
    }
}
