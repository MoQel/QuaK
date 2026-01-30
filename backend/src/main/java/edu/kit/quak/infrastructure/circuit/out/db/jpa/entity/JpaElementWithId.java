package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity;

import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@MappedSuperclass
public abstract class JpaElementWithId {
    @Id
    protected String id;
}
