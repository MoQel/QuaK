package edu.kit.quak.core.filesystem.model;

import org.springframework.http.MediaType;

import java.time.Instant;

/**
 * Domain POJO for FileElement
 */
public class File extends FileElement<File> {

    public static final String TYPE_IDENTIFIER = "file";
    public static final char ID_PREFIX = 'f';

    private Instant lastAccess;
    private Instant createdOn;
    private String contentType = MediaType.ALL_VALUE;

    protected File() {
        super();
    }

    public File(String name, FileElementContainer<?> parent) {
        super(name, parent);
        this.createdOn = Instant.now();
        this.lastAccess = createdOn;
    }

    @Override
    public void patch(File modified) {
        super.patch(modified);
        if (modified.lastAccess != null && modified.lastAccess.isAfter(lastAccess))
            this.lastAccess = modified.lastAccess;
    }

    //region getter and setter
    @Override
    public String getTypeIdentifier() {
        return TYPE_IDENTIFIER;
    }
    @Override
    public char getIdPrefix() { return ID_PREFIX; }

    @Override
    public String generateId(Object base) {
        return ID_PREFIX + base.toString();
    }

    public void setLastAccessNow() {
        setLastAccess(Instant.now());
    }

    public Instant getLastAccess() { return lastAccess; }
    public void setLastAccess(Instant lastAccess) {
        this.lastAccess = lastAccess;
    }

    public String getContentType() { return contentType; }

    public void setContentType(String contentType) { this.contentType = contentType; }


    public Instant getCreatedOn() { return createdOn; }
    //endregion
}
