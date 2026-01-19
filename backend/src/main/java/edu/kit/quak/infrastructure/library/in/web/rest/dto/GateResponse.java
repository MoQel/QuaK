package edu.kit.quak.infrastructure.library.in.web.rest.dto;

import edu.kit.quak.core.library.model.Gate;

public record GateResponse(
        String name, String type, String description, int qubitCount, Gate.SYMBOL symbol) {}
