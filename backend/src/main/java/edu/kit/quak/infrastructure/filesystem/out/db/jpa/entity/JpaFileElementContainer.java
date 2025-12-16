package edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;

import java.util.HashSet;
import java.util.Set;

@Entity
public abstract class JpaFileElementContainer<SELF extends JpaFileElementContainer<SELF>> extends JpaFileElement<SELF> {
    
    @OneToMany(mappedBy = "parent", orphanRemoval = true, cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    protected Set<JpaFileElement<?>> contents = new HashSet<>();

    protected JpaFileElementContainer() {
        super();
    }

    public JpaFileElementContainer(String name, JpaFileElementContainer<?> parent) {
        super(name, parent);
    }

    public Set<JpaFileElement<?>> getContents() {
        return contents;
    }

    public void setContents(Set<JpaFileElement<?>> contents) {
        this.contents = contents;
        for (JpaFileElement<?> element : contents) {
            element.setParent(this);
        }
    }
}