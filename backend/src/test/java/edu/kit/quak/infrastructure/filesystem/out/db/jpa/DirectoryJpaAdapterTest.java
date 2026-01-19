package edu.kit.quak.infrastructure.filesystem.out.db.jpa;

import static org.junit.jupiter.api.Assertions.*;

import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.FileElement;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.shared.tags.IntegrationTest;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@DataJpaTest
@org.springframework.context.annotation.ComponentScan(
        basePackages = "edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper")
@Import({DirectoryJpaAdapter.class, ProjectJpaAdapter.class})
@Transactional
class DirectoryJpaAdapterTest {

    @Autowired private DirectoryJpaAdapter adapter;

    @Autowired private ProjectJpaAdapter projectAdapter;

    @Test
    void saveAndFindDirectory_withFiles() {
        Project project = new Project("P");
        Project savedProject = projectAdapter.save(project);

        Directory dir = new Directory("Dir", savedProject.getId());
        File file = new File("File.txt", dir.getId());

        dir.addChild(file);

        Directory saved = adapter.save(dir);

        assertNotNull(saved.getId());

        Optional<Directory> loaded = adapter.findById(saved.getId());
        assertTrue(loaded.isPresent());

        Directory d = loaded.get();
        assertEquals("Dir", d.getName());
        assertEquals(1, d.getContents().size());

        FileElement<?> child = d.getContents().iterator().next();
        assertInstanceOf(File.class, child);
        assertEquals("File.txt", child.getName());

        // check parent
        assertEquals(d.getId(), child.getParentId());
    }

    @Test
    void existsById_returnsCorrectValue() {
        Directory saved = adapter.save(new Directory("Dir", null));

        assertTrue(adapter.existsById(saved.getId()));
        assertFalse(adapter.existsById("missing"));
    }

    @Test
    void updateDirectory_removesFile_whenRemovedFromList() {
        Directory dir = new Directory("UpdateDir", null);
        File file = new File("DeleteMe.txt", dir.getId());

        dir.addChild(file);

        Directory saved = adapter.save(dir);

        Directory loaded = adapter.findById(saved.getId()).orElseThrow();
        FileElement<?> fileToRemove = loaded.getContents().iterator().next();

        loaded.removeChild(fileToRemove);

        adapter.save(loaded);

        Directory reloaded = adapter.findById(saved.getId()).orElseThrow();
        assertTrue(reloaded.getContents().isEmpty());
    }
}
