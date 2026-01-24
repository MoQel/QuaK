package edu.kit.quak.core.filesystem.model;

import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

/**
 * Domain POJO for Project A project is a top level container of {@link FileElement}.
 *
 * @implNote Projects are in their core similar to a directory. They are implemented in an own class
 *     to allow for different functionalities later in development.
 * @author Henrik K
 */
@Getter
@Setter
public class Project extends FileElementContainer<Project> {

    public static final String TYPE_IDENTIFIER = "project";
    public static final char ID_PREFIX = 'p';

    /**
     * The UUID of the user who owns this project. This is used for user isolation - each user can
     * only see their own projects.
     */
    private UUID ownerId;

    public Project() {
        super();
    }

    public Project(String name) {
        super(name, null);
    }

    public Project(String name, UUID ownerId) {
        super(name, null);
        this.ownerId = ownerId;
    }

    @Override
    public String getTypeIdentifier() {
        return TYPE_IDENTIFIER;
    }

    @Override
    public char getIdPrefix() {
        return ID_PREFIX;
    }
}
