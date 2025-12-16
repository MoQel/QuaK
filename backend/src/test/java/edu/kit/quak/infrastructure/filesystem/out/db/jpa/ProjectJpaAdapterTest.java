package edu.kit.quak.infrastructure.filesystem.out.db.jpa;

import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.FileElement;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper.*;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.repository.SpringDataProjectRepository;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@Import({
        ProjectJpaAdapter.class,
        ProjectJpaMapperImpl.class,
        DirectoryJpaMapperImpl.class,
        FileJpaMapperImpl.class,
        FileElementJpaMapperImpl.class
})
@Transactional
public class ProjectJpaAdapterTest {

    @Autowired
    private ProjectJpaAdapter adapter;

    @Autowired
    private SpringDataProjectRepository repository;

    @Test
    @Tag("integration")
    void saveAndFindById_withContents() {
        Project project = new Project("ProjectA");
        Directory dir = new Directory("Dir", project.getId());
        File file = new File("File.txt", dir.getId());

        project.addChild(dir);
        dir.addChild(file);

        Project saved = adapter.save(project);

        assertNotNull(saved.getId());

        Optional<Project> loaded = adapter.findById(saved.getId());
        assertTrue(loaded.isPresent());

        Project p = loaded.get();
        assertEquals("ProjectA", p.getName());
        assertEquals(1, p.getContents().size());

        FileElement<?> loadedDir = p.getContents().iterator().next();
        assertInstanceOf(Directory.class, loadedDir);
        assertEquals("Dir", loadedDir.getName());

        // Test parent
        assertEquals(p.getId(), loadedDir.getParentId());

        // Test child elements
        Directory d = (Directory) loadedDir;
        assertEquals(1, d.getContents().size());
        assertInstanceOf(File.class, d.getContents().iterator().next());
    }

    @Test
    @Tag("integration")
    void getAllProjects_returnsAllPersistedProjects() {
        adapter.save(new Project("P1"));
        adapter.save(new Project("P2"));

        List<Project> projects = adapter.getAllProjects();

        assertEquals(2, projects.size());
        assertTrue(projects.stream().anyMatch(p -> p.getName().equals("P1")));
        assertTrue(projects.stream().anyMatch(p -> p.getName().equals("P2")));
    }

    @Test
    @Tag("integration")
    void existsById_returnsTrueWhenProjectExists() {
        Project saved = adapter.save(new Project("Exists"));

        assertTrue(adapter.existsById(saved.getId()));
        assertFalse(adapter.existsById("does-not-exist"));
    }

    @Test
    @Tag("integration")
    void deleteById_removesProjectFromDatabase() {
        Project saved = adapter.save(new Project("DeleteMe"));

        adapter.deleteById(saved.getId());

        assertFalse(adapter.existsById(saved.getId()));
        assertTrue(adapter.getAllProjects().isEmpty());
    }

    @Test
    @Tag("integration")
    void removingDirectoryFromProjectDeletesIt() {
        Project project = new Project("P");
        Directory dir = new Directory("Dir", project.getId());

        project.addChild(dir);

        Project saved = adapter.save(project);
        Project loaded = adapter.findById(saved.getId()).orElseThrow();

        Directory loadedDir = (Directory) loaded.getContents().iterator().next();
        loaded.removeChild(loadedDir);

        adapter.save(loaded);

        Project reloaded = adapter.findById(saved.getId()).orElseThrow();
        assertTrue(reloaded.getContents().isEmpty());
    }
}
