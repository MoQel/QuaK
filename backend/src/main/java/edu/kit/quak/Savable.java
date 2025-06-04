package edu.kit.quak;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public interface Savable {
    @Id
    String getId();

    void setId(String id);
}
