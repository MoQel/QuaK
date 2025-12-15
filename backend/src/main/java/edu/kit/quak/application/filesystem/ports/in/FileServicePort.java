package edu.kit.quak.application.filesystem.ports.in;

import edu.kit.quak.core.filesystem.model.File;

public interface FileServicePort {

    File createFile(File element, String parentId);

    File renameFile(String fId, String newName);

    void removeFile(String id);

    File retrieveFile(String id);

    void setFileContent(String fileId, byte[] content, String contentType);

    byte[] getFileContent(String fileId);
}