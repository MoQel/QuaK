package edu.kit.quak.infrastructure.filesystem.out.persistence.jpa.entity;

import jakarta.persistence.*;

@Entity
public class JpaDirectory extends JpaFileElementContainer<JpaDirectory> {

    public static final String TYPE_IDENTIFIER = "directory";
    public static final char ID_PREFIX = 'd';

    protected JpaDirectory() {
        super();
    }

    public JpaDirectory(String name, JpaDirectory parent) {
        super(name, parent);
    }

    @Override
    public String getTypeIdentifier() {
        return TYPE_IDENTIFIER;
    }

    @Override
    public String generateId(Object base) {
        return ID_PREFIX + base.toString();
    }
}