package edu.kit.quak.files.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;



public class Gate {

    public enum SYMBOL {
        H,
        X,
        Y,
        Z,
        CNOT,
        CZ,
        SWAP,
        CCX,
        S,
        T,
        RX,
        RY,
        RZ,
        M
    }

    @JsonProperty
    private final String name;

    @JsonProperty
    private final String type;

    @JsonProperty
    private final String description;

    @JsonProperty
    private final int qubitCount;

    @JsonProperty
    private final SYMBOL symbol;


//parameters list?

    @JsonCreator
    public Gate(@JsonProperty("name") String name,
                @JsonProperty("type") String type,
                @JsonProperty("description") String description,
                @JsonProperty("qubitCount") int qubitCount,
                @JsonProperty("symbol") SYMBOL symbol
    ) {
        this.name = name;
        this.type = type;
        this.description = description;
        this.qubitCount = qubitCount;
        this.symbol = symbol;

    }

    public String getName() {
        return name;
    }

    public String getType() {
        return type;
    }

    public String getDescription() {
        return description;
    }

    public int getQubitCount() {
        return qubitCount;
    }

    public SYMBOL getSymbol() {
        return symbol;
    }
}
