package edu.kit.quak.application.filesystem.ports.incoming;

import edu.kit.quak.core.filesystem.model.File;

import java.util.Optional;

public interface FileServicePort {

    File createFile(File element, String parentId);

    Optional<File> renameFile(String fId, String newName);

    void removeFile(String id);

    Optional<File> retrieveFile(String id);

    void setFileContent(String fileId, byte[] content, String contentType) throws Exception;

    Optional<byte[]> getFileContent(String fileId);
}