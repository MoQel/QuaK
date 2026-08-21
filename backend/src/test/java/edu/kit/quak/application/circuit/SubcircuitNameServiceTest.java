package edu.kit.quak.application.circuit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import edu.kit.quak.application.circuit.ports.out.CircuitRepositoryPort;
import edu.kit.quak.application.circuit.services.SubcircuitNameService;
import edu.kit.quak.application.filesystem.ports.in.FileServicePort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.shared.tags.UnitTest;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@UnitTest
@ExtendWith(MockitoExtension.class)
class SubcircuitNameServiceTest {

    private static final String PROJECT = "p-1";

    @Mock
    private CircuitRepositoryPort circuitRepository;

    @Mock
    private FileServicePort fileService;

    @InjectMocks
    private SubcircuitNameService service;

    private final User user = new User();

    private static QuantumCircuit circuitOf(String projectId, String fileId) {
        return QuantumCircuit.builder().id("c-1").projectId(projectId).fileId(fileId).registers(List.of()).layers(List.of()).build();
    }

    @Test
    void resolvesTheFileNameOfTheReferencedCircuit() {
        when(circuitRepository.findById("c-1")).thenReturn(Optional.of(circuitOf(PROJECT, "f-1")));
        when(fileService.retrieveFile("f-1", user)).thenReturn(new File("bell.qasm", "d-1"));

        assertEquals(Map.of("c-1", "bell.qasm"), service.resolveNames(List.of("c-1"), PROJECT, user));
    }

    @Test
    void refusesToNameACircuitFromAnotherProject() {
        // The id comes from the client, so resolving it across projects would turn this into a
        // lookup oracle for foreign file names.
        when(circuitRepository.findById("c-1")).thenReturn(Optional.of(circuitOf("someone-elses-project", "f-1")));

        assertTrue(service.resolveNames(List.of("c-1"), PROJECT, user).isEmpty());
        verify(fileService, never()).retrieveFile(any(), any());
    }

    @Test
    void leavesUnresolvableReferencesOut() {
        when(circuitRepository.findById("gone")).thenReturn(Optional.empty());

        assertTrue(service.resolveNames(List.of("gone"), PROJECT, user).isEmpty());
    }

    @Test
    void leavesOutACircuitWithoutAFile() {
        when(circuitRepository.findById("c-1")).thenReturn(Optional.of(circuitOf(PROJECT, null)));

        assertTrue(service.resolveNames(List.of("c-1"), PROJECT, user).isEmpty());
    }

    @Test
    void aDeniedOrMissingFileDoesNotFailTheWholeRequest() {
        when(circuitRepository.findById("c-1")).thenReturn(Optional.of(circuitOf(PROJECT, "f-1")));
        when(fileService.retrieveFile("f-1", user)).thenThrow(new RuntimeException("no access"));

        assertTrue(service.resolveNames(List.of("c-1"), PROJECT, user).isEmpty());
    }

    @Test
    void looksUpEachReferencedCircuitOnce() {
        // Several calls of the same subcircuit are the normal case; they must not each hit the
        // repository.
        when(circuitRepository.findById("c-1")).thenReturn(Optional.of(circuitOf(PROJECT, "f-1")));
        when(fileService.retrieveFile("f-1", user)).thenReturn(new File("bell.qasm", "d-1"));

        service.resolveNames(List.of("c-1", "c-1", "c-1"), PROJECT, user);

        verify(circuitRepository, times(1)).findById("c-1");
    }
}
