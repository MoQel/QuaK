package edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * JPA Entity for Storage
 * Contains persistence annotations and id configurations
 */
@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "dtype", discriminatorType = DiscriminatorType.STRING)
@Table(name = "file_element")
public abstract class JpaFileElement<SELF extends JpaFileElement<?>> {

    @Id
    @Column(name = "Id")
    private String id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "createdOn", nullable = false, updatable = false)
    private Instant createdOn;

    @Column(name = "lastAccess", nullable = false)
    private Instant lastAccess;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn
    private JpaFileElementContainer<?> parent;

    public JpaFileElement(String name, JpaFileElementContainer<?> parent) {
        this.name = name;
        this.parent = parent;
    }

    protected JpaFileElement() { }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Instant getCreatedOn() { return createdOn; }
    public void setCreatedOn(Instant createdOn) { this.createdOn = createdOn; }
    public Instant getLastAccess() { return lastAccess; }
    public void setLastAccess(Instant lastAccess) { this.lastAccess = lastAccess; }
    public JpaFileElementContainer<?> getParent() { return parent; }
    public void setParent(JpaFileElementContainer<?> parent) { this.parent = parent; }

    @Override
    public final boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof JpaFileElement<?> that)) return false;
        return getId() != null && getId().equals(that.getId());
    }

    @Override
    public final int hashCode() {
        return JpaFileElement.class.hashCode();
    }
}
