package edu.kit.quak.infrastructure.editorstate.in.web.rest.dto;

/** Opaque JSON document describing the user's open editor tabs, owned by the frontend. */
public record UpdateEditorStateRequest(String tabsJson) {}
