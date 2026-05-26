package edu.kit.quak.application.circuit.antlr;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.circuit.model.register.Register;
import java.util.ArrayList;
import java.util.List;

public class QasmCircuitVisitor extends OpenQASM3ParserBaseVisitor<Void> {

    private final QuantumCircuit circuit = new QuantumCircuit("test-1");
    private int layerIdx = 0;

    public QuantumCircuit getCircuit() {
        return circuit;
    }

    @Override
    public Void visitQuantumDeclarationStatement(OpenQASM3Parser.QuantumDeclarationStatementContext ctx) {
        System.out.print("2");
        circuit.toString();
        System.out.print("3");

        String registerName = ctx.Identifier().getText();
        OpenQASM3Parser.QubitTypeContext typeCtx = ctx.qubitType();
        OpenQASM3Parser.DesignatorContext designator = typeCtx.designator();

        int size = 1; // Default, wenn kein [x] angegeben ist
        if (designator != null) {
            try {
                size = Integer.parseInt(designator.expression().getText());
            } catch (NumberFormatException e) {
                // Hier greift später eine solide Ausdrucks-Auswertung,
                // für den Moment fangen wir komplexe Ausdrücke ab.
                size = 1;
            }
        }

        // Sucht das Register dynamisch nach Name ("q")
        var existingRegisterOpt = circuit.getRegisterByName(registerName);

        if (existingRegisterOpt.isPresent()) {
            Register register = existingRegisterOpt.get();

            // Prüfen, ob es wirklich ein QuantumRegister ist, bevor wir Qubits hinzufügen
            if (register instanceof QuantumRegister quantumRegister) {
                int currentSize = quantumRegister.getNumberOfQubits();
                for (int i = currentSize; i < size; i++) {
                    quantumRegister.addQubit();
                }
            }
        }

        return null;
    }

    @Override
    public Void visitGateCallStatement(OpenQASM3Parser.GateCallStatementContext ctx) {
        String gateName = ctx.Identifier() != null ? ctx.Identifier().getText() : ctx.GPHASE().getText();

        List<ElementSelector> targetQubits = new ArrayList<>();
        List<ElementSelector> controlQubits = new ArrayList<>();

        int numOperands = ctx.gateOperandList().gateOperand().size();
        int currentOperand = 1;
        System.out.println("size: " + numOperands);

        if (ctx.gateOperandList() != null) {
            for (OpenQASM3Parser.GateOperandContext operand : ctx.gateOperandList().gateOperand()) {
                var id = operand.indexedIdentifier();
                String registerName = id.Identifier().getText(); // z.B. "q"
                var existingRegisterOpt = circuit.getRegisterByName(registerName);
                String registerId = "";
                if (existingRegisterOpt.isPresent()) {
                    Register register = existingRegisterOpt.get();
                    registerId = register.getId();
                }

                int index = 0;

                List<OpenQASM3Parser.IndexOperatorContext> indices = id.indexOperator();
                if (indices != null && !indices.isEmpty()) {
                    List<OpenQASM3Parser.ExpressionContext> exprs = indices.getFirst().expression();
                    if (exprs != null && !exprs.isEmpty()) {
                        index = Integer.parseInt(exprs.getFirst().getText());
                    }
                }

                // Erstelle einen echten ElementSelector für euer Modell
                ElementSelector selector = new ElementSelector(registerId, index);

                // TODO Mappingtabelle
                // Unterscheidung: Ist es ein Kontroll- oder Zielqubit?
                // Einfache Heuristik für Standardgatter (z.B. bei "cx q[0], q[1]" ist q[0] control, q[1] target)
                // HINWEIS: Für eine exakte Zuordnung müsste man eine Gatter-Bibliothek abfragen.
                System.out.println(gateName);
                if (gateName.startsWith("c") && currentOperand < numOperands) {
                    controlQubits.add(selector);
                } else {
                    targetQubits.add(selector);
                }
                currentOperand++;
            }
        }
        System.out.println("targ: " + targetQubits);
        System.out.println("cont: " + controlQubits);

        QuantumOperation operation = new ElementaryQuantumGate(
            QuantumOperationLibrary.valueOf(gateName.toUpperCase()),
            false,
            targetQubits,
            controlQubits,
            0.0
        );

        circuit.addQuantumOperation(operation, layerIdx);
        layerIdx++;
        return null;
    }
}
