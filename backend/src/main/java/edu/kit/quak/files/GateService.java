package edu.kit.quak.files;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.kit.quak.files.model.Gate;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class GateService {

    private final List<Gate> gates;

    public GateService(ObjectMapper objectMapper) {
        this.gates = loadGatesFromJson(objectMapper);
    }

    private List<Gate> loadGatesFromJson(ObjectMapper objectMapper) {
        try {
            ClassPathResource resource = new ClassPathResource("gates.json");
            try (InputStream is = resource.getInputStream()) {
                Gate[] gateArray = objectMapper.readValue(is, Gate[].class);
                return Arrays.asList(gateArray);
            }
        } catch (IOException e) {
            // You can handle this differently if you want
            throw new IllegalStateException("Failed to load gates.json", e);
        }
    }

    public List<Gate> getAllGates() {
        return gates;
    }

    public Optional<Gate> getByName(String name) {
        return gates.stream()
                .filter(g -> g.getName().equalsIgnoreCase(name))
                .findFirst();
    }
}
