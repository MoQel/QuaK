package edu.kit.quak.infrastructure.library.out.json;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.kit.quak.shared.tags.UnitTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@UnitTest
class JsonGateRepositoryAdapterTest {

    private JsonGateRepositoryAdapter adapter;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setup() {
        // Arrange
        String testFile = "test-gates.json";
        adapter = new JsonGateRepositoryAdapter(objectMapper, testFile);
        adapter.init(); // Simulates @PostConstruct
    }

    @Test
    void loadGates_parsesJsonCorrectly() {
        // Act
        var gates = adapter.findAllGates();

        // Assert
        assertFalse(gates.isEmpty());
        assertEquals("Hadamard", gates.getFirst().name());
    }

    @Test
    void findGateByName_isCaseInsensitive() {
        // Act
        adapter.findGateByName("h");
        var searchResult = adapter.findGateByName("hadamard");

        // Assert
        assertTrue(searchResult.isPresent());
        assertEquals("Hadamard", searchResult.get().name());
    }
}