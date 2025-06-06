package edu.kit.quak.files.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Entity;
import jakarta.persistence.Lob;

import java.time.Instant;

@Entity
public class File extends FileElement<File> {

    @JsonProperty
    private Instant lastAccess;

    @JsonProperty
    private Instant createdOn;

    @JsonIgnore
    private String contentType;
    @Lob
    @JsonIgnore
    private byte[] content;

    protected File() { }

    public File(String name) {
        super(name);
        this.createdOn = Instant.now();
    }

    public void setLastAccessNow() {
        setLastAccess(Instant.now());
    }

    public void setLastAccess(Instant lastAccess) {
        this.lastAccess = lastAccess;
    }

    @Override
    public File patch(File modified) {
        return null;
    }

    @Override
    public Type getType() {
        return Type.FILE;
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
}
