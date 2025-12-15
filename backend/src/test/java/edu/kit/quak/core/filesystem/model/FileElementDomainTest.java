package edu.kit.quak.core.filesystem.model;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class FileElementDomainTest {

    @Test
    @Tag("unit")
    void projectAddAndRemoveDirectory() {
        Project project = new Project("MyProject");
        Directory dir = new Directory("MyDir", project);

        assertTrue(project.getContents().contains(dir));
        assertEquals(project, dir.getParent().orElseThrow());

        project.removeElement(dir);
        assertFalse(project.getContents().contains(dir));
        assertTrue(dir.getParent().isEmpty());
    }

    @Test
    @Tag("unit")
    void directoryAddAndRemoveFile() {
        Project project = new Project("P");
        Directory dir = new Directory("Dir", project);
        File file = new File("File1", dir);

        assertTrue(dir.getContents().contains(file));
        assertEquals(dir, file.getParent().orElseThrow());

        dir.removeElement(file);
        assertFalse(dir.getContents().contains(file));
        assertTrue(file.getParent().isEmpty());
    }

    @Test
    @Tag("unit")
    void fileRenameUpdatesLastAccess() throws InterruptedException {
        Directory dir = new Directory("Dir", null);
        File file = new File("OldName", dir);

        Instant beforeRename = file.getLastAccess();
        Thread.sleep(5);

        file.rename("NewName");
        assertEquals("NewName", file.getName());
        assertTrue(file.getLastAccess().isAfter(beforeRename));
    }

    @Test
    @Tag("unit")
    void renameChildOnContainer() {
        Directory dir = new Directory("Dir", null);
        File file = new File("File1", dir);

        dir.renameChild(file, "RenamedFile");
        assertEquals("RenamedFile", file.getName());

        File orphan = new File("Orphan", null);
        assertThrows(IllegalArgumentException.class, () -> dir.renameChild(orphan, "Fail"));
    }

    @Test
    @Tag("unit")
    void projectAddMultipleDirectoriesAndFiles() {
        Project project = new Project("Proj");
        Directory dir1 = new Directory("Dir1", project);
        Directory dir2 = new Directory("Dir2", project);

        File f1 = new File("F1", dir1);
        File f2 = new File("F2", dir2);

        Set<FileElement<?>> contents = project.getContents();
        assertTrue(contents.contains(dir1));
        assertTrue(contents.contains(dir2));

        assertTrue(dir1.getContents().contains(f1));
        assertTrue(dir2.getContents().contains(f2));
    }

    @Test
    @Tag("unit")
    void removingAndReAddingWorks() {
        Directory dir = new Directory("Dir", null);
        File file = new File("File1", dir);

        dir.removeElement(file);
        assertTrue(file.getParent().isEmpty());

        file.addToParent(dir);
        assertEquals(dir, file.getParent().orElseThrow());
        assertTrue(dir.getContents().contains(file));
    }

    @Test
    @Tag("unit")
    void renameChildUpdatesFileLastAccess() throws InterruptedException {
        Directory dir = new Directory("Dir", null);
        File file = new File("File1", dir);

        Instant before = file.getLastAccess();
        Thread.sleep(5);

        dir.renameChild(file, "Renamed");

        assertEquals("Renamed", file.getName());
        assertTrue(file.getLastAccess().isAfter(before));
    }

    @Test
    @Tag("unit")
    void parentCannotBeSelf() {
        Directory dir = new Directory("Dir", null);
        assertThrows(IllegalArgumentException.class, () -> dir.addToParent(dir));
    }

    @Test
    @Tag("unit")
    void movingElementBetweenContainersWorks() {
        Project root = new Project("Root");
        Directory d1 = new Directory("D1", root);
        Directory d2 = new Directory("D2", root);
        File f = new File("F", d1);

        f.addToParent(d2);

        assertFalse(d1.getContents().contains(f));
        assertTrue(d2.getContents().contains(f));
        assertEquals(d2, f.getParent().orElseThrow());
    }

    @Test
    @Tag("unit")
    void cannotAddDuplicateNameToContainer() {
        Directory dir = new Directory("Root", null);
        new File("Config.txt", dir);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> new File("Config.txt", dir));

        assertTrue(ex.getMessage().contains("already exists"), "Exception message should mention duplication");

        Directory otherDir = new Directory("Other", null);
        File conflictFile = new File("Config.txt", otherDir);

        assertThrows(IllegalArgumentException.class, () -> conflictFile.addToParent(dir));

        assertEquals(otherDir, conflictFile.getParent().orElseThrow());
        assertFalse(dir.getContents().contains(conflictFile));
    }
}
