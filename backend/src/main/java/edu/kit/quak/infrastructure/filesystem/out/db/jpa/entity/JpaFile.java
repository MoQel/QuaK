package edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

/**
 * JPA entity for persisting File domain objects.
 * This lives in the infrastructure layer and maps directly to the database schema.
 */
@Entity
@DiscriminatorValue("file")
public class JpaFile extends JpaFileElement<JpaFile> {

    @Column(name = "content_type")
    private String contentType;

    protected JpaFile() {
        super();
    }

    public JpaFile(String name, JpaFileElementContainer<?> parent) {
        super(name, parent);
    }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
}