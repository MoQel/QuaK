package edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.Setter;

/**
 * JPA entity for persisting File domain objects. This lives in the infrastructure layer and maps
 * directly to the database schema.
 */
@Entity
@DiscriminatorValue("file")
@Getter
@Setter
public class JpaFile extends JpaFileElement<JpaFile> {

    protected JpaFile() {
        super();
    }

    public JpaFile(String name, JpaFileElementContainer<?> parent) {
        super(name, parent);
    }
}
