package edu.kit.quak.application.filesystem.delegator;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

import edu.kit.quak.application.filesystem.ports.out.FileElementContainerRepositoryPort;
import edu.kit.quak.shared.tags.UnitTest;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@UnitTest
@ExtendWith(MockitoExtension.class)
class FileElementContainerRepositoryRegistryTest {

    @Mock
    FileElementContainerRepositoryPort<?> repoP;

    @Mock
    FileElementContainerRepositoryPort<?> repoD;

    @Test
    @DisplayName("Registry maps repositories correctly by their prefix")
    void registryMapsPrefixesCorrectly() {
        // Define prefixes via port method
        when(repoP.idPrefix()).thenReturn('p');
        when(repoD.idPrefix()).thenReturn('d');

        var registry = new FileElementContainerRepositoryRegistry(List.of(repoP, repoD));

        assertTrue(registry.getRepository('p').isPresent());
        assertEquals(repoP, registry.getRepository('p').get());

        assertTrue(registry.getRepository('d').isPresent());
        assertEquals(repoD, registry.getRepository('d').get());
    }

    @Test
    @DisplayName("Registry throws exception if duplicate prefixes are detected")
    void registryThrowsOnDuplicatePrefix() {
        when(repoP.idPrefix()).thenReturn('p');
        when(repoD.idPrefix()).thenReturn('p'); // Conflict!

        List<FileElementContainerRepositoryPort<?>> repos = List.of(repoP, repoD);

        assertThrows(IllegalStateException.class, () -> new FileElementContainerRepositoryRegistry(repos));
    }
}
