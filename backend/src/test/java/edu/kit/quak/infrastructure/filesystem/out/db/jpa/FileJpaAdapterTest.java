package edu.kit.quak.infrastructure.filesystem.out.db.jpa;

import static org.junit.jupiter.api.Assertions.*;

import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.shared.tags.IntegrationTest;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

@IntegrationTest
@DataJpaTest
@org.springframework.context.annotation.ComponentScan(basePackages = "edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper")
@Import({ FileJpaAdapter.class, DirectoryJpaAdapter.class, ProjectJpaAdapter.class })
class FileJpaAdapterTest {

    @Autowired
    private FileJpaAdapter fileAdapter;

    @Autowired
    private DirectoryJpaAdapter directoryAdapter;

    @Autowired
    private ProjectJpaAdapter projectAdapter;

    @Test
    void findById_returnsFile_whenExists() {
        Project project = projectAdapter.save(new Project("Project_FileTest"));
        Directory dir = new Directory("Dir", project.getId());
        File file = new File("TestFile.txt", dir.getId());

        dir.addChild(file);

        Directory savedDir = directoryAdapter.save(dir);

        String fileId = savedDir
            .getContents()
            .stream()
            .filter(e -> e.getName().equals("TestFile.txt"))
            .findFirst()
            .orElseThrow()
            .getId();

        // 2. Act
        Optional<File> loaded = fileAdapter.findById(fileId);

        // 3. Assert
        assertTrue(loaded.isPresent());
        assertEquals("TestFile.txt", loaded.get().getName());

        assertEquals(savedDir.getId(), loaded.get().getParentId());
    }

    @Test
    void existsById_returnsTrue_whenFileExists() {
        // Arrange
        Project p = projectAdapter.save(new Project("P_Exist"));
        Directory d = new Directory("D", p.getId());
        File file = new File("Exists.txt", d.getId());

        p.addChild(d);
        d.addChild(file);

        Directory savedDir = directoryAdapter.save(d);
        String fileId = savedDir.getContents().iterator().next().getId();

        // Act & Assert
        assertTrue(fileAdapter.existsById(fileId));
        assertFalse(fileAdapter.existsById("non-existent-id"));
    }
}
