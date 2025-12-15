package edu.kit.quak.infrastructure.filesystem.out.db.jpa;

import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper.DirectoryJpaMapperImpl;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper.FileElementJpaMapperImpl;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper.FileJpaMapperImpl;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper.ProjectJpaMapperImpl;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@Import({
        FileJpaAdapter.class,
        DirectoryJpaAdapter.class,
        ProjectJpaAdapter.class,
        FileJpaMapperImpl.class,
        DirectoryJpaMapperImpl.class,
        ProjectJpaMapperImpl.class,
        FileElementJpaMapperImpl.class
})
class FileJpaAdapterTest {

    @Autowired
    private FileJpaAdapter fileAdapter;

    @Autowired
    private DirectoryJpaAdapter directoryAdapter;

    @Autowired
    private ProjectJpaAdapter projectAdapter;

    @Test
    @Tag("integration")
    void findById_returnsFile_whenExists() {
        Project project = projectAdapter.save(new Project("Project_FileTest"));
        Directory dir = new Directory("Dir", project);
        new File("TestFile.txt", dir);

        Directory savedDir = directoryAdapter.save(dir);

        String fileId = savedDir.getContents().stream()
                .filter(e -> e.getName().equals("TestFile.txt"))
                .findFirst()
                .orElseThrow()
                .getId();

        // 2. Act
        Optional<File> loaded = fileAdapter.findById(fileId);

        // 3. Assert
        assertTrue(loaded.isPresent());
        assertEquals("TestFile.txt", loaded.get().getName());

        assertTrue(loaded.get().getParent().isPresent());
        assertEquals(savedDir.getId(), loaded.get().getParent().get().getId());
    }

    @Test
    @Tag("integration")
    void existsById_returnsTrue_whenFileExists() {
        // Arrange
        Project p = projectAdapter.save(new Project("P_Exist"));
        Directory d = new Directory("D", p);
        new File("Exists.txt", d);

        Directory savedDir = directoryAdapter.save(d);
        String fileId = savedDir.getContents().iterator().next().getId();

        // Act & Assert
        assertTrue(fileAdapter.existsById(fileId));
        assertFalse(fileAdapter.existsById("non-existent-id"));
    }
}
