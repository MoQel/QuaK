package edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.annotation.JsonTypeIdResolver;
import edu.kit.quak.files.configuration.CustomIdGenerator;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.configuration.FileElementResolver;
import jakarta.persistence.*;

/**
 * JPA Entity for Storage
 * Contains persistence annotations and id configurations
 */
@Entity
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.EXISTING_PROPERTY,
        property = JpaFileElement.TYPE_FIELD
)
@JsonTypeIdResolver(FileElementResolver.class)
public abstract class JpaFileElement<SELF extends JpaFileElement<?>> {

    public static final String TYPE_FIELD = "type";

    @JsonProperty
    @Id
    @CustomIdGenerator.FileElementId
    private String id;

    @JsonProperty
    private String name;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.EAGER)
    private JpaFileElementContainer<?> parent;

    protected JpaFileElement() { }

    public JpaFileElement(String name, JpaFileElementContainer<?> parent) {
        this.name = name;
        this.parent = parent;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public JpaFileElementContainer<?> getParent() { return parent; }
    public void setParent(JpaFileElementContainer<?> parent) { this.parent = parent; }

    @JsonProperty(TYPE_FIELD)
    public abstract String getTypeIdentifier();
    public abstract String generateId(Object base);
}
