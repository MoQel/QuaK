package edu.kit.quak.infrastructure.circuit.in.web.rest.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.ElementSelectorDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ElementSelectorDtoMapperTest {

    @InjectMocks
    private ElementSelectorDtoMapperImpl mapper;

    @Test
    void toResponse() {
        // Arrange
        String registerId = "id";
        int index = 0;
        ElementSelector selector = new ElementSelector(registerId, index);

        // Act
        ElementSelectorDto response = mapper.toResponse(selector);

        // Assert
        assertNotNull(response);
        assertEquals(registerId, response.registerId());
        assertEquals(index, response.index());
    }

    @Test
    void toDomain() {
        // Arrange
        String registerId = "id";
        int index = 0;
        ElementSelectorDto selector = new ElementSelectorDto(registerId, index);

        // Act
        ElementSelector response = mapper.toDomain(selector);

        // Assert
        assertNotNull(response);
        assertEquals(registerId, response.getRegisterId());
        assertEquals(index, response.getIndex());
    }
}
