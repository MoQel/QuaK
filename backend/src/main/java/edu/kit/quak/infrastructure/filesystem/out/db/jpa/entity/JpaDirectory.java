package edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("directory")
public class JpaDirectory extends JpaFileElementContainer<JpaDirectory> {

    protected JpaDirectory() {
        super();
    }

    public JpaDirectory(String name, JpaFileElementContainer<?> parent) {
        super(name, parent);
    }
}
