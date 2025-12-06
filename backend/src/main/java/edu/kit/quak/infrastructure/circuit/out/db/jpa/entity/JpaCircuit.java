package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;

@Entity
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.EXISTING_PROPERTY,
        property = JpaCircuit.TYPE_FIELD
)
public class JpaCircuit {
    public static final String TYPE_IDENTIFIER = "directory";
    public static final char ID_PREFIX = 'c';

    public static final String TYPE_FIELD = "type";

    @JsonProperty
    @Id
    @GeneratedValue
    private String id;

    public JpaCircuit() {
    }

    public String getId() {
        return id;
    }
    public void setId(String id) {
        this.id = id;
    }

    @JsonProperty(TYPE_FIELD)
    public String getTypeIdentifier() {
        return TYPE_IDENTIFIER;
    }

    public String generateId(Object base) {
        return ID_PREFIX + base.toString();
    }
}
