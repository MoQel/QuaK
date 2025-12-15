package edu.kit.quak.infrastructure.filesystem.out.db.jpa;

import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.FileElement;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper.DirectoryJpaMapperImpl;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper.FileElementJpaMapperImpl;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper.FileJpaMapperImpl;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper.ProjectJpaMapperImpl;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.repository.SpringDataDirectoryRepository;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@Import({
        DirectoryJpaAdapter.class,
        ProjectJpaAdapter.class,
        DirectoryJpaMapperImpl.class,
        FileJpaMapperImpl.class,
        ProjectJpaMapperImpl.class,
        FileElementJpaMapperImpl.class
})
@Transactional
class DirectoryJpaAdapterTest {

    @Autowired
    private DirectoryJpaAdapter adapter;

    @Autowired
    private SpringDataDirectoryRepository repository;

    @Autowired
    private ProjectJpaAdapter projectAdapter;

    @Test
    @Tag("integration")
    void saveAndFindDirectory_withFiles() {
        Project project = new Project("P");
        Project savedProject = projectAdapter.save(project);

        Directory dir = new Directory("Dir", savedProject);
        new File("File.txt", dir);


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
        assertTrue(child.getParent().isPresent());
        assertEquals(d, child.getParent().get());
    }

    @Test
    @Tag("integration")
    void existsById_returnsCorrectValue() {
        Directory saved = adapter.save(new Directory("Dir", null));

        assertTrue(adapter.existsById(saved.getId()));
        assertFalse(adapter.existsById("missing"));
    }

    @Test
    @Tag("integration")
    void updateDirectory_removesFile_whenRemovedFromList() {
        Directory dir = new Directory("UpdateDir", null);
        new File("DeleteMe.txt", dir);
        Directory saved = adapter.save(dir);

        Directory loaded = adapter.findById(saved.getId()).orElseThrow();
        FileElement<?> fileToRemove = loaded.getContents().iterator().next();

        loaded.removeElement(fileToRemove);

        adapter.save(loaded);

        Directory reloaded = adapter.findById(saved.getId()).orElseThrow();
        assertTrue(reloaded.getContents().isEmpty());
    }
}