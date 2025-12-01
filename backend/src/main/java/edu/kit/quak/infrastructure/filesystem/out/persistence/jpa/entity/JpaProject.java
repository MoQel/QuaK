package edu.kit.quak.infrastructure.filesystem.out.persistence.jpa.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import jakarta.persistence.Entity;

@Entity
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NONE
)
public class JpaProject extends JpaFileElementContainer<JpaProject> {

    public static final String TYPE_IDENTIFIER = "project";
    public static final char ID_PREFIX = 'p';

    protected JpaProject() {
        super();
    }

    public JpaProject(String name) {
        super(name, null);
    }

    @Override
    @JsonIgnore
    public String getTypeIdentifier() {
        return TYPE_IDENTIFIER;
    }

    @Override
    public String generateId(Object base) {
        return ID_PREFIX + base.toString();
    }
}