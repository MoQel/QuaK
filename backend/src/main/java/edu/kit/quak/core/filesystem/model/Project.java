package edu.kit.quak.core.filesystem.model;

/**
 * Domain POJO for Project
 * A project is a top level container of {@link FileElement}.
 *
 * @implNote Projects are in their core similar to a directory.
 * They are implemented in an own class to allow for different functionalities
 * later in development.
 * @author Henrik K
 */
public class Project extends FileElementContainer<Project> {

    public static final String TYPE_IDENTIFIER = "project";
    public static final char ID_PREFIX = 'p';

    protected Project() { super(); }

    public Project(String name) {
        super(name, null);
    }

    @Override
    public String getTypeIdentifier() {
        return TYPE_IDENTIFIER;
    }
    @Override
    public char getIdPrefix() { return ID_PREFIX; }
}
