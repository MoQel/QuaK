package edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper;

import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation.JpaElementSelector;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@ExtendWith(MockitoExtension.class)
class ElementSelectorJpaMapperTest {
    @InjectMocks
    private ElementSelectorJpaMapperImpl mapper;

    @Test
    void domainToEntity() {
        // Arrange
        String registerId = "reg_id";
        int index = 0;
        ElementSelector domain = new ElementSelector(registerId, index);

        // Act
        JpaElementSelector entity = mapper.toEntity(domain);

        // Assert
        assertNotNull(entity);
        assertEquals(registerId, entity.getRegisterId());
        assertEquals(index, entity.getIndex());
    }

    @Test
    void entityToDomain() {
        // Arrange
        String registerId = "reg_id";
        int index = 0;
        JpaElementSelector entity = new JpaElementSelector();
        entity.setRegisterId(registerId);
        entity.setIndex(index);

        // Act
        ElementSelector domain = mapper.toDomain(entity);

        // Assert
        assertNotNull(domain);
        assertEquals(registerId, domain.getRegisterId());
        assertEquals(index, domain.getIndex());
    }
}
