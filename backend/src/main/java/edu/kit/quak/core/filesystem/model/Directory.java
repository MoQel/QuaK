package edu.kit.quak.core.filesystem.model;

/**
 * Domain POJO for Directory A Directory is a container of FileElements inside a project.
 *
 * @author Henrik K
 */
public class Directory extends FileElementContainer<Directory> {

    public static final String TYPE_IDENTIFIER = "directory";
    public static final char ID_PREFIX = 'd';

    protected Directory() {
        super();
    }

    public Directory(String name, String parentId) {
        super(name, parentId);
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
