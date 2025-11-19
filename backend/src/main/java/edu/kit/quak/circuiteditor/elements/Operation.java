package edu.kit.quak.circuiteditor.elements;

import java.util.List;

public class Operation {

    private final String gateName;
    private final List<Integer> targetQubits;
    private final Integer timeIndex; // optional, falls du später Timing nutzt

    public Operation(String gateName, List<Integer> targetQubits, Integer timeIndex) {
        this.gateName = gateName;
        this.targetQubits = targetQubits;
        this.timeIndex = timeIndex;
    }

    public String getGateName() {
        return gateName;
    }

    public List<Integer> getTargetQubits() {
        return targetQubits;
    }

    public Integer getTimeIndex() {
        return timeIndex;
    }

    @Override
    public String toString() {
        return gateName + " " + targetQubits + " @" + timeIndex;
    }
}