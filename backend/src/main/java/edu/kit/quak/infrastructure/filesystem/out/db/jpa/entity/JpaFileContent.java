package edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;

@Entity
public class JpaFileContent {

    // One to One foreign key to File
    @Id
    @Column(name = "file_id", nullable = false, updatable = false)
    private String fileId;

    @Lob private byte[] content;

    protected JpaFileContent() {}

    public JpaFileContent(String fileId, byte[] content) {
        this.fileId = fileId;
        this.content = content;
    }

    public byte[] getContent() {
        return content;
    }

    public void setContent(byte[] content) {
        this.content = content;
    }

    public String getFileId() {
        return fileId;
    }
}
