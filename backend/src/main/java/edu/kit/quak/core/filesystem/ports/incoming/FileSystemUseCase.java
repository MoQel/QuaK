package edu.kit.quak.core.filesystem.ports.incoming;

import edu.kit.quak.core.filesystem.domain.File;
import edu.kit.quak.core.filesystem.domain.FileElement;
import edu.kit.quak.core.filesystem.domain.Project;
import java.util.List;

public interface FileSystemUseCase {

    // --- Project Operations ---
    List<Project> getAllProjects();
    Project createProject(Project project);
    Project getProject(String id);
    Project patchProject(String id, Project modified);
    void deleteProject(String id);

    // --- File/Directory Operations ---
    FileElement<?> getFileElement(String id);
    void deleteFileElement(String id);

    // Creating an element (file or directory) within a parent
    FileElement<?> createFileElement(String parentId, FileElement<?> newElement);

    // Patching an element (file or directory)
    void patchFileElement(String id, FileElement<?> modified);

    // --- File Specific Operations ---
    File getFileWithContent(String id);
    void updateFileContent(String id, byte[] content, String contentType);
}