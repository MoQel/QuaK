package edu.kit.quak.core.filesystem.ports.incoming;

import edu.kit.quak.core.filesystem.domain.File;

public interface FileServicePort {

    File create(File element, String parentId);

    File update(File element);

    void delete(String id);

    File get(String id);

    byte[] getContent(String fileId);

    void setContent(String fileId, byte[] content, String contentType);
}