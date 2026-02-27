package edu.kit.quak.infrastructure.circuit.in.web.rest.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.spy;

import edu.kit.quak.core.circuit.model.layer.Layer;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.LayerResponse;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class LayerDtoMapperTest {

    private LayerDtoMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = Mappers.getMapper(LayerDtoMapper.class);
        QuantumOperationDtoMapper quantumOperationDtoMapper = spy(Mappers.getMapper(QuantumOperationDtoMapper.class));
        ElementSelectorDtoMapper elementSelectorDtoMapper = spy(Mappers.getMapper(ElementSelectorDtoMapper.class));
        ReflectionTestUtils.setField(quantumOperationDtoMapper, "elementSelectorDtoMapper", elementSelectorDtoMapper);
        ReflectionTestUtils.setField(mapper, "quantumOperationDtoMapper", quantumOperationDtoMapper);
    }

    @Test
    void toResponse() {
        // Arrange
        ElementSelector target = new ElementSelector("id", 0);
        ElementaryQuantumGate operation = new ElementaryQuantumGate(QuantumOperationLibrary.H, false, List.of(target), null, 0d);
        Layer layer = new Layer(List.of(operation));

        // Act
        LayerResponse response = mapper.toResponse(layer);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.quantumOperations().size());
        assertEquals(operation.getId(), response.quantumOperations().getFirst().getId());
    }
}
