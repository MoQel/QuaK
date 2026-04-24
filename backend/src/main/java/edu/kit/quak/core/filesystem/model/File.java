package edu.kit.quak.core.filesystem.model;

import lombok.Getter;
import lombok.Setter;

/** Domain POJO for FileElement */
@Setter
@Getter
public class File extends FileElement<File> {

    public static final String TYPE_IDENTIFIER = "file";
    public static final char ID_PREFIX = 'f';

    public File(String name, String parentId) {
        super(name, parentId);
    }

    protected File() {
        super();
    }

    // region getter and setter
    @Override
    public String getTypeIdentifier() {
        return TYPE_IDENTIFIER;
    }

    @Override
    public char getIdPrefix() {
        return ID_PREFIX;
    }
    // endregion
}
