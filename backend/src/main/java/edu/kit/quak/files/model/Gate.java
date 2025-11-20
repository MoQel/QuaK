package edu.kit.quak.files.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class Gate {

    @JsonProperty
    private final String name;

    @JsonProperty
    private final String type;

    @JsonProperty
    private final String description;

    @JsonProperty
    private final int qubitCount;

    @JsonProperty
    private final String symbol;


//parameters list?

    @JsonCreator
    public Gate(@JsonProperty("name") String name,
                @JsonProperty("type") String type,
                @JsonProperty("description") String description,
                @JsonProperty("qubitCount") int qubitCount,
                @JsonProperty("symbol") String symbol
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

    public String getSymbol() {
        return symbol;
    }
}
