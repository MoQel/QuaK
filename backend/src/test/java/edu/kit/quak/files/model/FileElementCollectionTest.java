package edu.kit.quak.files.model;

import edu.kit.quak.QuaKApplicationTests;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.Project;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class FileElementCollectionTest extends QuaKApplicationTests {

    @Test
    //This test is more of a sanity check
    public void collectionDeletesElement() {
        Project main = projects.save(new Project("Hi"));
        File file = files.save(new File("Hello", main));
        assertTrue(main.getElements().contains(file));
        assertTrue(main.removeElement(file));
        assertFalse(main.getElements().contains(file));
    }
}
