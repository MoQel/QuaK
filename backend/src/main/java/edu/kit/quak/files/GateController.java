package edu.kit.quak.files;

import edu.kit.quak.files.model.Gate;
import edu.kit.quak.files.GateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
@RequestMapping("/gates")
@Tag(name = "Gates", description = "Quantum gate operations")
public class GateController {

    private final GateService gateService;

    public GateController(GateService gateService) {
        this.gateService = gateService;
    }

    @GetMapping
    public List<Gate> getAllGates() {
        return gateService.getAllGates();
    }

    @GetMapping("/{name}")
    public ResponseEntity<Gate> getGateByName(@PathVariable String name) {
        return gateService.getByName(name)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "No matching Gate found for name"));
    }
}
