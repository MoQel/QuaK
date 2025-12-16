package edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("project")
public class JpaProject extends JpaFileElementContainer<JpaProject> {
    public JpaProject() { super(); }

    public JpaProject(String name) {
        super(name, null);
    }
}