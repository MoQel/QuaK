package edu.kit.quak.application.circuit.antlr;

import edu.kit.quak.application.circuit.antlr.elements.Operation;
import edu.kit.quak.application.circuit.antlr.elements.QuantumCircuit;
import edu.kit.quak.application.circuit.antlr.elements.Qubit;
import java.util.ArrayList;
import java.util.List;

public class QasmCircuitVisitor extends OpenQASM3ParserBaseVisitor<Void> {

    private final QuantumCircuit circuit = new QuantumCircuit();

    public QuantumCircuit getCircuit() {
        return circuit;
    }

    @Override
    public Void visitQuantumDeclarationStatement(OpenQASM3Parser.QuantumDeclarationStatementContext ctx) {
        String name = ctx.Identifier().getText();
        OpenQASM3Parser.QubitTypeContext typeCtx = ctx.qubitType();

        OpenQASM3Parser.DesignatorContext designator = typeCtx.designator(); // e.g. '[1]'
        if (designator != null) {
            int size = Integer.parseInt(designator.expression().getText());
            for (int i = 0; i < size; i++) {
                circuit.addQubit(new Qubit(name, i));
            }
        } else {
            circuit.addQubit(new Qubit(name, 0));
        }

        return null;
    }

    @Override
    public Void visitGateCallStatement(OpenQASM3Parser.GateCallStatementContext ctx) {
        String gateName = ctx.Identifier() != null ? ctx.Identifier().getText() : ctx.GPHASE().getText();

        List<Integer> targetIndices = new ArrayList<>();

        if (ctx.gateOperandList() != null) {
            for (OpenQASM3Parser.GateOperandContext operand : ctx.gateOperandList().gateOperand()) {
                var id = operand.indexedIdentifier();
                int index = 0;

                List<OpenQASM3Parser.IndexOperatorContext> indices = id.indexOperator();
                if (indices != null && !indices.isEmpty()) {
                    // Simplification: Only use the first index (No support for e.g.: 'cx q[1][2];')
                    List<OpenQASM3Parser.ExpressionContext> exprs = indices.getFirst().expression();
                    if (exprs != null && !exprs.isEmpty()) {
                        // Simplification: Only use the first expression (No support for e.g.: 'cx q[i+1];')
                        index = Integer.parseInt(exprs.getFirst().getText());
                    }
                }

                targetIndices.add(index);
            }
        }
        circuit.addOperation(new Operation(gateName, targetIndices, null));
        return null;
    }
}
