package edu.kit.quak.files.model;

import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Entity;
import jakarta.persistence.Lob;
import org.springframework.http.MediaType;

import java.time.Instant;

@Entity
public class File extends FileElement<File> {

    public static final String TYPE_IDENTIFIER = "file";
    public static final char ID_PREFIX = 'f';

    @JsonProperty
    private Instant lastAccess;

    @JsonProperty
    private Instant createdOn;

    @JsonProperty
    private String contentType = MediaType.ALL_VALUE;
    @Lob
    @JsonIgnore
    private byte[] content;

    protected File() { }

    public File(String name) {
        super(name);
        this.createdOn = Instant.now();
        this.lastAccess = Instant.now();
    }

    public void setLastAccessNow() {
        setLastAccess(Instant.now());
    }

    public void setLastAccess(Instant lastAccess) {
        this.lastAccess = lastAccess;
    }

    @Override
    public void patch(File modified) {
        super.patch(modified);
        if (modified.lastAccess != null && modified.lastAccess.isAfter(lastAccess))
            this.lastAccess = modified.lastAccess;
    }

    @Override
    public String getTypeIdentifier() {
        return TYPE_IDENTIFIER;
    }

    @Override
    public String generateId(Object base) {
        return ID_PREFIX + base.toString();
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public byte[] getContent() {
        return content;
    }

    public void setContent(byte[] content) {
        this.content = content;
    }

    public Instant getLastAccess() {
        return lastAccess;
    }

    public Instant getCreatedOn() {
        return createdOn;
    }

    @JsonGetter("lastAccess")
    private long getLastAccessLong() {
        return lastAccess.getEpochSecond();
    }

    @JsonGetter("createdOn")
    private long getCreatedOnLong() {
        return createdOn.getEpochSecond();
    }
}
