package edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity;

import jakarta.persistence.Entity;

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
}