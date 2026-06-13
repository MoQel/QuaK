package edu.kit.quak;

import edu.kit.quak.application.circuit.antlr.QasmService;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/** Main entry point for the QuaK application. */
@SpringBootApplication
public class QuaKApplication {

    public static void main(String[] args) {
        SpringApplication.run(QuaKApplication.class, args);
        QasmService service = new QasmService();
    }
}
