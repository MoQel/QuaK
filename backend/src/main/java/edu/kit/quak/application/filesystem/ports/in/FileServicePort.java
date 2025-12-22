package edu.kit.quak.application.filesystem.ports.in;

import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.user.model.User;

public interface FileServicePort {

    File createFile(File element, String parentId, User user);

    File renameFile(String fId, String newName, User user);

    void removeFile(String id, User user);

    File retrieveFile(String id, User user);

    void setFileContent(String fileId, byte[] content, String contentType, User user);

    byte[] getFileContent(String fileId, User user);
}