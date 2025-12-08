package edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity;

import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Entity;

import java.time.Instant;

/**
 * JPA entity for persisting File domain objects.
 * This lives in the infrastructure layer and maps directly to the database schema.
 */
@Entity
public class JpaFile extends JpaFileElement<JpaFile> {

    public static final String TYPE_IDENTIFIER = "file";
    public static final char ID_PREFIX = 'f';

    @JsonProperty
    private Instant lastAccess;

    @JsonProperty
    private Instant createdOn;

    @JsonProperty
    private String contentType;

    protected JpaFile() {
        super();
    }

    public JpaFile(String name, JpaFileElementContainer<?> parent) {
        super(name, parent);
        // JPA entities often set default values (Instant.now()) not in the constructor,
        // but via JPA lifecycle hooks (PrePersist), but we leave it here for consistency.
        this.createdOn = Instant.now();
        this.lastAccess = Instant.now();
    }

    @Override
    public String getTypeIdentifier() {
        return TYPE_IDENTIFIER;
    }

    //region getter and setter
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public Instant getLastAccess() { return lastAccess; }
    public void setLastAccess(Instant lastAccess) { this.lastAccess = lastAccess; }
    public Instant getCreatedOn() { return createdOn; }
    public void setCreatedOn(Instant createdOn) { this.createdOn = createdOn; }

    @JsonGetter("lastAccess")
    private long getLastAccessLong() {
        return lastAccess != null ? lastAccess.getEpochSecond() : 0;
    }

    @JsonGetter("createdOn")
    private long getCreatedOnLong() {
        return createdOn != null ? createdOn.getEpochSecond() : 0;
    }
    //endregion
}