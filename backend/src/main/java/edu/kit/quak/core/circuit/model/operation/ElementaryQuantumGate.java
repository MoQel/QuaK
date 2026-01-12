package edu.kit.quak.core.circuit.model.operation;

public class ElementaryQuantumGate extends QuantumOperation {
    private final ElementaryQuantumGateType type;

    private double theta;
    private double phi;
    private double lambda;

    public ElementaryQuantumGate(ElementaryQuantumGateType type) {
        super();
        this.type = type;
    }

    public ElementaryQuantumGateType getType() {
        return type;
    }

    public double getTheta() { return theta; }
    public void setTheta(double theta) { this.theta = theta; }

    public double getPhi() { return phi; }
    public void setPhi(double phi) { this.phi = phi; }

    public double getLambda() { return lambda; }
    public void setLambda(double lambda) { this.lambda = lambda; }

    @Override
    public String toString() {
        return String.format("[Gate: %s (id=%s)]", getType(), getId());
    }
}