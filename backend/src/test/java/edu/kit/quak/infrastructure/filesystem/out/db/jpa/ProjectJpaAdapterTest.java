package edu.kit.quak.infrastructure.filesystem.out.db.jpa;

import static org.junit.jupiter.api.Assertions.*;

import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.FileElement;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.shared.tags.IntegrationTest;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@DataJpaTest
@org.springframework.context.annotation.ComponentScan(basePackages = "edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper")
@Import({ ProjectJpaAdapter.class })
@Transactional
public class ProjectJpaAdapterTest {

    @Autowired
    private ProjectJpaAdapter adapter;

    @Test
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
    void getProjectsByOwnerId_returnsOnlyOwnedProjects() {
        UUID user1Id = UUID.randomUUID();
        UUID user2Id = UUID.randomUUID();

        Project p1 = new Project("User1-Project1", user1Id);
        Project p2 = new Project("User1-Project2", user1Id);
        Project p3 = new Project("User2-Project1", user2Id);

        adapter.save(p1);
        adapter.save(p2);
        adapter.save(p3);

        // User 1 should only see their 2 projects
        List<Project> user1Projects = adapter.getProjectsByOwnerId(user1Id);
        assertEquals(2, user1Projects.size());
        assertTrue(user1Projects.stream().allMatch(p -> p.getOwnerId().equals(user1Id)));

        // User 2 should only see their 1 project
        List<Project> user2Projects = adapter.getProjectsByOwnerId(user2Id);
        assertEquals(1, user2Projects.size());
        assertEquals(user2Id, user2Projects.get(0).getOwnerId());

        // Non-existent user should see no projects
        List<Project> noProjects = adapter.getProjectsByOwnerId(UUID.randomUUID());
        assertTrue(noProjects.isEmpty());
    }

    @Test
    void existsById_returnsTrueWhenProjectExists() {
        Project saved = adapter.save(new Project("Exists"));

        assertTrue(adapter.existsById(saved.getId()));
        assertFalse(adapter.existsById("does-not-exist"));
    }

    @Test
    void deleteById_removesProjectFromDatabase() {
        Project saved = adapter.save(new Project("DeleteMe"));

        adapter.deleteById(saved.getId());

        assertFalse(adapter.existsById(saved.getId()));
    }

    @Test
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
