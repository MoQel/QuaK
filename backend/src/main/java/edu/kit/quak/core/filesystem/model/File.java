package edu.kit.quak.core.filesystem.model;

/**
 * Domain POJO for FileElement
 */
public class File extends FileElement<File> {

    public static final String TYPE_IDENTIFIER = "file";
    public static final char ID_PREFIX = 'f';

    /**
     * Default content type for files when no specific type is set.
     * Represents "accept all" or "unknown" media type.
     */
    public static final String DEFAULT_CONTENT_TYPE = "*/*";

    private String contentType = DEFAULT_CONTENT_TYPE;

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

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    // endregion
}
