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

    public static final String INITIAL_FILE_NAME = "hello_world.qasm";
    public static final String INITIAL_FILE_CONTENT = """
        OPENQASM 3.0;
        include "stdgates.inc";

        qubit[2] q;

        h q[0];
        cx q[0], q[1];
        """;

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

    /** Creates a project for the given owner that starts with {@link #INITIAL_FILE_NAME}. */
    public static Project create(String name, UUID ownerId) {
        Project project = new Project(name, ownerId);
        project.addChild(new File(INITIAL_FILE_NAME, project.getId()));
        return project;
    }

    /** Hands the project over to another owner. */
    public void transferTo(UUID newOwnerId) {
        this.ownerId = newOwnerId;
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
