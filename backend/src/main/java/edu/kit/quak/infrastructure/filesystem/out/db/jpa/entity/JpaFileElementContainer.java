package edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity;

import com.fasterxml.jackson.annotation.JsonFilter;
import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSetter;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.configuration.DepthFilter;
import jakarta.persistence.*;

import java.util.*;

@Entity
public abstract class JpaFileElementContainer<SELF extends JpaFileElementContainer<SELF>> extends JpaFileElement<SELF> {
    
    @JsonIgnore
    @OneToMany(mappedBy = "parent", orphanRemoval = true, cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    protected Set<JpaFileElement<?>> contents = new HashSet<>();

    public JpaFileElementContainer(String name, JpaFileElementContainer<?> parent) {
        super(name, parent);
    }

    protected JpaFileElementContainer() {
        super();
    }

    @JsonSetter("contents")
    public boolean addElements(Collection<JpaFileElement<?>> elements) {
        for (JpaFileElement<?> element : elements) {
            element.setParent(this);
        }
        return contents.addAll(elements);
    }

    public void addElement(JpaFileElement<?> child) {
        child.setParent(this);
        contents.add(child);
    }

    @JsonGetter("contents")
    @JsonFilter(DepthFilter.FILTER_NAME)
    public Set<JpaFileElement<?>> getElements() {
        return new HashSet<>(contents);
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