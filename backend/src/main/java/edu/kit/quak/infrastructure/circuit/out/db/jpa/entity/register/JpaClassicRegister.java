package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;

@Entity
public class JpaClassicRegister {
    @Id
    @GeneratedValue
    private String id;
}
