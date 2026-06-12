package edu.kit.quak.infrastructure.editorstate.in.web.rest.dto;

/** Editor state of the authenticated user for a project; tabsJson is null when nothing was saved yet. */
public record EditorStateResponse(String projectId, String tabsJson) {}
