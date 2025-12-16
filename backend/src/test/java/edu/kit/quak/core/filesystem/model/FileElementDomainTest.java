package edu.kit.quak.core.filesystem.model;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class FileElementDomainTest {

    @Test
    @Tag("unit")
    void elementsHaveCorrectIdPrefixes() {
        Project p = new Project("TestProject");
        assertTrue(p.getId().startsWith("p-"), "Project ID should start with 'p-'");

        Directory d = new Directory("TestDir", p.getId());
        assertTrue(d.getId().startsWith("d-"), "Directory ID should start with 'd-'");

        File f = new File("TestFile.txt", d.getId());
        assertTrue(f.getId().startsWith("f-"), "File ID should start with 'f-'");
    }

    @Test
    @Tag("unit")
    void projectAddAndRemoveDirectory() {
        // Arrange
        Project project = new Project("MyProject");
        // Der Konstruktor setzt die ParentID initial
        Directory dir = new Directory("MyDir", project.getId());

        // Act
        project.addChild(dir);

        // Assert
        assertTrue(project.getContents().contains(dir));
        assertEquals(project.getId(), dir.getParentId(), "ParentID must match Project ID");

        project.removeChild(dir);

        assertFalse(project.getContents().contains(dir));
        assertNull(dir.getParentId(), "ParentID should be null after removal");
    }

    @Test
    @Tag("unit")
    void directoryAddAndRemoveFile() {
        // Arrange
        Project project = new Project("P");
        Directory dir = new Directory("Dir", project.getId());
        project.addChild(dir);

        // Act
        File file = new File("File1", dir.getId());
        dir.addChild(file);

        // Assert
        assertTrue(dir.getContents().contains(file));
        assertEquals(dir.getId(), file.getParentId());

        dir.removeChild(file);

        assertFalse(dir.getContents().contains(file));
        assertNull(file.getParentId());
    }

    @Test
    @Tag("unit")
    void fileRenameUpdatesLastAccess() throws InterruptedException {
        String dummyParentId = "d-" + UUID.randomUUID();
        File file = new File("OldName", dummyParentId);

        Instant beforeRename = file.getLastAccess();
        Thread.sleep(10);

        file.rename("NewName");

        assertEquals("NewName", file.getName());
        assertTrue(file.getLastAccess().isAfter(beforeRename), "LastAccess should update on rename");
    }

    @Test
    @Tag("unit")
    void projectAddMultipleDirectoriesAndFiles() {
        // Arrange
        Project project = new Project("Proj");

        Directory dir1 = new Directory("Dir1", project.getId());
        Directory dir2 = new Directory("Dir2", project.getId());

        // Act
        project.addChild(dir1);
        project.addChild(dir2);

        File f1 = new File("F1", dir1.getId());
        dir1.addChild(f1);

        File f2 = new File("F2", dir2.getId());
        dir2.addChild(f2);

        // Assert: correct hierarchy
        assertTrue(project.getContents().contains(dir1));
        assertTrue(project.getContents().contains(dir2));
        assertTrue(dir1.getContents().contains(f1));
        assertTrue(dir2.getContents().contains(f2));
        assertFalse(project.getContents().contains(f1));
    }

    @Test
    @Tag("unit")
    void movingElementBetweenContainersWorks() {
        Project root = new Project("Root");
        Directory sourceDir = new Directory("Source", root.getId());
        Directory targetDir = new Directory("Target", root.getId());

        root.addChild(sourceDir);
        root.addChild(targetDir);

        File file = new File("MoveMe", sourceDir.getId());
        sourceDir.addChild(file);

        assertEquals(sourceDir.getId(), file.getParentId());

        // Act: Move logic
        sourceDir.removeChild(file);

        targetDir.addChild(file);

        // Assert
        assertFalse(sourceDir.getContents().contains(file));
        assertTrue(targetDir.getContents().contains(file));
        assertEquals(targetDir.getId(), file.getParentId(), "ParentID must be updated to new container");
    }

    @Test
    @Tag("unit")
    void cannotAddDuplicateNameToContainer() {
        Directory dir = new Directory("Root", "p-1");
        File f1 = new File("Config.txt", dir.getId());
        dir.addChild(f1);

        File f2 = new File("Config.txt", dir.getId());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> dir.addChild(f2));

        assertTrue(ex.getMessage().toLowerCase().contains("exists"));
    }
}