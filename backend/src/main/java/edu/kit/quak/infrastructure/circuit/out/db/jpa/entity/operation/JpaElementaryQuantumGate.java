package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.operation;

import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGateDefinitionIdentifier;
import jakarta.persistence.*;

@Entity
@DiscriminatorValue("ELEMENTARY_GATE")
public class JpaElementaryQuantumGate extends JpaQuantumOperation {
    @Enumerated(EnumType.STRING)
    private ElementaryQuantumGateDefinitionIdentifier definitionId;

    private double theta;
    private double phi;
    private double lambda;

    public ElementaryQuantumGateDefinitionIdentifier getDefinitionId() {
        return definitionId;
    }

    public void setDefinitionId(ElementaryQuantumGateDefinitionIdentifier definitionId) {
        this.definitionId = definitionId;
    }

    public double getTheta() {
        return theta;
    }

    public void setTheta(double theta) {
        this.theta = theta;
    }

    public double getPhi() {
        return phi;
    }

    public void setPhi(double phi) {
        this.phi = phi;
    }

    public double getLambda() {
        return lambda;
    }

    public void setLambda(double lambda) {
        this.lambda = lambda;
    }
}
