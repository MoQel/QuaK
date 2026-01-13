package edu.kit.quak.core.library.model;

public record Gate(
        String name,
        String type,
        String description,
        int qubitCount,
        Gate.SYMBOL symbol
) {
    public enum SYMBOL {
        H, X, Y, Z, CNOT, CZ, SWAP, CCX, S, T, RX, RY, RZ, M
    }
}
