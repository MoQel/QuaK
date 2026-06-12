package edu.kit.quak.core.editorstate.model;

import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

/**
 * Per-user editor state of a project: which tabs were open in the editor,
 * stored as an opaque JSON document owned by the frontend.
 */
@Getter
@Setter
public class EditorState {

    private String id;
    private String projectId;
    private String userId;
    private String tabsJson;

    public EditorState(String projectId, String userId, String tabsJson) {
        this.id = UUID.randomUUID().toString();
        this.projectId = projectId;
        this.userId = userId;
        this.tabsJson = tabsJson;
    }

    public EditorState(String id, String projectId, String userId, String tabsJson) {
        this.id = id;
        this.projectId = projectId;
        this.userId = userId;
        this.tabsJson = tabsJson;
    }
}
