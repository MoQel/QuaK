package edu.kit.quak.core.filesystem.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import edu.kit.quak.core.filesystem.exception.DuplicateNameException;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.shared.tags.UnitTest;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@UnitTest
class ProjectNamingTest {

    private final UUID owner = UUID.randomUUID();

    @Test
    @DisplayName("a name is taken regardless of case")
    void takenRegardlessOfCase() {
        List<Project> owned = List.of(new Project("Demo", owner));

        assertThrows(DuplicateNameException.class, () -> ProjectNaming.ensureAvailable("DEMO", owned));
        assertDoesNotThrow(() -> ProjectNaming.ensureAvailable("Other", owned));
    }

    @Test
    @DisplayName("a renamed project may keep its own name, but not take another's")
    void renameChecksOtherProjectsOnly() {
        Project demo = new Project("Demo", owner);
        List<Project> owned = List.of(demo, new Project("Other", owner));

        assertDoesNotThrow(() -> ProjectNaming.ensureAvailableForRename(demo, "demo", owned));
        assertThrows(DuplicateNameException.class, () -> ProjectNaming.ensureAvailableForRename(demo, "other", owned));
    }

    @Test
    @DisplayName("moving projects keep free names and number taken ones after all free names")
    void numbersTakenNames() {
        Project demo = new Project("Demo", UUID.randomUUID());
        Project demoTwo = new Project("Demo (2)", UUID.randomUUID());
        Project other = new Project("Other", UUID.randomUUID());

        ProjectNaming.makeNamesUnique(List.of(demo, demoTwo, other), List.of(new Project("Demo", owner)));

        assertEquals("Demo (3)", demo.getName());
        assertEquals("Demo (2)", demoTwo.getName());
        assertEquals("Other", other.getName());
    }
}
