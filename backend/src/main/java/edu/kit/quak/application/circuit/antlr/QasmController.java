package edu.kit.quak.application.circuit.antlr;

import edu.kit.quak.application.circuit.antlr.elements.QuantumCircuit;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/qasm")
public class QasmController {

    private final QasmService service;

    public QasmController(QasmService service) {
        this.service = service;
    }

    @PostMapping("/parse")
    public QuantumCircuit parse(@RequestBody String qasm) {
        return service.parse(qasm);
    }
}
