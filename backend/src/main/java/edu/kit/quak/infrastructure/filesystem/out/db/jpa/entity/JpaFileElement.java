package edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

/** JPA Entity for Storage Contains persistence annotations and id configurations */
@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "dtype", discriminatorType = DiscriminatorType.STRING)
@Table(name = "file_element")
@Getter
@Setter
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

    protected JpaFileElement() {}

    @Override
    public final boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof JpaFileElement<?> that)) return false;
        return getId() != null && getId().equals(that.getId());
    }

    @Override
    public final int hashCode() {
        return getId() != null ? getId().hashCode() : 0;
    }
}
