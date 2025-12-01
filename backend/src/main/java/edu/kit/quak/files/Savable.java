package edu.kit.quak.files;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

/**
 * Defines the ID of every savable entity.
 *
 * @author Henrik K
 */
@Entity
public interface Savable {
    @Id
    String getId();

    void setId(String id);
}
