package edu.kit.quak.core.filesystem.event;

/**
 * Published when a project has been deleted, so that other contexts can remove the data they keep for that project.
 *
 * @param projectId The ID of the deleted project
 */
public record ProjectDeletedEvent(String projectId) {}
