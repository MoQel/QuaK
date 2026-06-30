package edu.kit.quak.application.lsp.exceptions;

import lombok.Getter;

@Getter
public class LspCapacityExceededException extends LspCommunicationException {

    public enum Limit {
        GLOBAL,
        USER,
    }

    private final Limit limit;

    public LspCapacityExceededException(Limit limit) {
        super(limit == Limit.GLOBAL ? "Global LSP process limit reached" : "LSP process limit reached for user");
        this.limit = limit;
    }
}
