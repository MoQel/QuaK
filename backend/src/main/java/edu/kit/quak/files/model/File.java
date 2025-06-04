package edu.kit.quak.files.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.gson.JsonElement;
import jakarta.persistence.Entity;

import java.time.Instant;

@Entity
public class File extends FileElement {

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
    public Type getType() {
        return Type.FILE;
    }

    @Override
    public JsonElement toJson() {
        return null;
    }
}
