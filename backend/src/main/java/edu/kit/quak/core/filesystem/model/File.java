package edu.kit.quak.core.filesystem.model;

import org.springframework.http.MediaType;

/**
 * Domain POJO for FileElement
 */
public class File extends FileElement<File> {

    public static final String TYPE_IDENTIFIER = "file";
    public static final char ID_PREFIX = 'f';

    private String contentType = MediaType.ALL_VALUE;

    public File(String name, String parentId) {
        super(name, parentId);
    }

    protected File() {
        super();
    }

    //region getter and setter
    @Override
    public String getTypeIdentifier() {
        return TYPE_IDENTIFIER;
    }
    @Override
    public char getIdPrefix() { return ID_PREFIX; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }


    //endregion
}
