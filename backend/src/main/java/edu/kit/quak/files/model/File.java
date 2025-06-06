package edu.kit.quak.files.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Entity;

import java.time.Instant;

@Entity
public class File extends FileElement<File> {

    @JsonProperty
    private Instant lastAccess;

    @JsonProperty
    private Instant createdOn;

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
}
