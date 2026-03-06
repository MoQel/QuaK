package edu.kit.quak.core.user.model;

/**
 * Enum representing the roles a user can have on a project.
 *
 * <ul>
 * <li>{@link #OWNER} – Full access: read, write, delete, and manage roles.</li>
 * <li>{@link #VIEWER} – Read-only access: can only retrieve project data via
 * GET requests.</li>
 * </ul>
 */
public enum ProjectRole {
    OWNER,
    VIEWER,
}
