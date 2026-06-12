package edu.kit.quak.application.circuit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import edu.kit.quak.application.circuit.exceptions.CircuitNotFoundException;
import edu.kit.quak.application.circuit.ports.out.CircuitRepositoryPort;
import edu.kit.quak.application.circuit.services.CircuitService;
import edu.kit.quak.application.filesystem.delegator.FileElementContainerRepositoryDelegator;
import edu.kit.quak.application.filesystem.ports.out.FileRepositoryPort;
import edu.kit.quak.application.user.ports.in.ProjectRoleServicePort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.user.model.ProjectRole;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.shared.tags.UnitTest;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@UnitTest
@ExtendWith(MockitoExtension.class)
class CircuitServiceTest {

    @Mock
    private CircuitRepositoryPort repository;

    @Mock
    private ProjectRoleServicePort projectRoleService;

    @Mock
    private FileRepositoryPort fileRepository;

    @Mock
    private FileElementContainerRepositoryDelegator fileElementDelegator;

    @InjectMocks
    private CircuitService service;

    private User mockUser() {
        return new User(UUID.randomUUID(), "tester", "tester@example.com");
    }

    private void mockAccess(String projectId, User user, ProjectRole role) {
        when(projectRoleService.hasMinimumRole(projectId, user.getId(), role)).thenReturn(true);
    }

    @Test
    void get_returnsCircuit_whenFound() {
        // setup
        String projectId = "p-1";
        User user = mockUser();
        QuantumCircuit circuit = new QuantumCircuit(projectId);
        when(repository.findByProjectId(projectId)).thenReturn(Optional.of(circuit));
        mockAccess(projectId, user, ProjectRole.VIEWER);

        // execute
        QuantumCircuit result = service.getByProjectId(projectId, user);

        // verify state
        assertEquals(circuit, result);
    }

    @Test
    void getByProjectId_throwsException_whenNotFound() {
        // setup
        String projectId = "unknown";
        User user = mockUser();
        when(repository.findByProjectId(projectId)).thenReturn(Optional.empty());
        mockAccess(projectId, user, ProjectRole.VIEWER);

        // execute & verify exception
        CircuitNotFoundException exception = assertThrows(CircuitNotFoundException.class, () -> service.getByProjectId(projectId, user));
        // verify context data (RFC 7807)
        assertEquals("Circuit", exception.getResourceType());
    }

    @Test
    void getById_returnsCircuit_whenFound() {
        // setup
        String projectId = "p-1";
        String circuitId = "c-1";
        QuantumCircuit circuit = new QuantumCircuit(projectId);
        circuit.setId(circuitId);
        when(repository.findById(circuitId)).thenReturn(Optional.of(circuit));

        // execute
        QuantumCircuit result = service.getById(circuitId);

        // verify state
        assertEquals(circuit, result);
    }

    @Test
    void get_throwsException_whenNotFound() {
        // setup
        String circuitId = "unknown";
        when(repository.findById(circuitId)).thenReturn(Optional.empty());

        // execute & verify exception
        CircuitNotFoundException exception = assertThrows(CircuitNotFoundException.class, () -> service.getById(circuitId));
        // verify context data (RFC 7807)
        assertEquals("Circuit", exception.getResourceType());
        assertEquals("Circuit not found: " + circuitId, exception.getResourceId());
    }

    @Test
    void delete_callsRepository() {
        // setup
        String circuitId = "c-1";
        String projectId = "p-1";
        User user = mockUser();
        QuantumCircuit circuit = new QuantumCircuit(projectId);
        circuit.setId(circuitId);
        when(repository.findById(circuitId)).thenReturn(Optional.of(circuit));
        mockAccess(projectId, user, ProjectRole.OWNER);

        // execute
        service.delete(circuitId, user);

        // verify delegation
        verify(repository).delete(circuitId);
    }

    @Test
    void resetByCircuitId_deletesOldAndCreatesNew() {
        // setup
        String projectId = "p-1";
        String circuitId = "c-1";
        User user = mockUser();
        QuantumCircuit circuit = new QuantumCircuit(projectId);
        circuit.setId(circuitId);
        when(repository.findById(circuitId)).thenReturn(Optional.of(circuit));
        when(repository.save(any(QuantumCircuit.class))).thenAnswer(i -> i.getArguments()[0]);
        mockAccess(projectId, user, ProjectRole.OWNER);

        // execute
        QuantumCircuit result = service.resetCircuit(circuitId, user);

        // verify old circuit deleted and new one saved
        verify(repository).delete(circuitId);
        verify(repository).save(any(QuantumCircuit.class));
        assertNotNull(result);
        assertEquals(projectId, result.getProjectId());
    }

    @Test
    void addQubit_updatesAndSavesCircuit() {
        // setup
        String circuitId = "c-1";
        String projectId = "p-1";
        String registerId = "r-1";
        User user = mockUser();
        QuantumCircuit circuitMock = mock(QuantumCircuit.class);
        when(circuitMock.getProjectId()).thenReturn(projectId);

        when(repository.findById(circuitId)).thenReturn(Optional.of(circuitMock));
        when(repository.save(circuitMock)).thenReturn(circuitMock);
        mockAccess(projectId, user, ProjectRole.OWNER);

        // execute
        QuantumCircuit result = service.addQubit(circuitId, registerId, user);

        // verify delegation and save
        verify(circuitMock).addQubit(registerId);
        verify(repository).save(circuitMock);
        assertEquals(circuitMock, result);
    }

    @Test
    void removeQubit_updatesAndSavesCircuit() {
        // setup
        String circuitId = "c-1";
        String projectId = "p-1";
        String registerId = "r-1";
        int qubitIdx = 2;
        User user = mockUser();
        QuantumCircuit circuitMock = mock(QuantumCircuit.class);
        when(circuitMock.getProjectId()).thenReturn(projectId);

        when(repository.findById(circuitId)).thenReturn(Optional.of(circuitMock));
        when(repository.save(circuitMock)).thenReturn(circuitMock);
        mockAccess(projectId, user, ProjectRole.OWNER);

        // execute
        QuantumCircuit result = service.removeQubit(circuitId, registerId, qubitIdx, user);

        // verify delegation and save
        verify(circuitMock).removeQubit(registerId, qubitIdx);
        verify(repository).save(circuitMock);
        assertEquals(circuitMock, result);
    }

    @Test
    void addQuantumOperation_updatesAndSavesCircuit() {
        // setup
        String circuitId = "c-1";
        String projectId = "p-1";
        int layerIdx = 1;
        User user = mockUser();
        QuantumOperation operationMock = mock(QuantumOperation.class);
        QuantumCircuit circuitMock = mock(QuantumCircuit.class);
        when(circuitMock.getProjectId()).thenReturn(projectId);

        when(repository.findById(circuitId)).thenReturn(Optional.of(circuitMock));
        when(repository.save(circuitMock)).thenReturn(circuitMock);
        mockAccess(projectId, user, ProjectRole.OWNER);

        // execute
        QuantumCircuit result = service.addQuantumOperation(circuitId, operationMock, layerIdx, user);

        // verify delegation and save
        verify(circuitMock).addQuantumOperation(operationMock, layerIdx);
        verify(repository).save(circuitMock);
        assertEquals(circuitMock, result);
    }

    @Test
    void moveQuantumOperation_updatesAndSavesCircuit() {
        // setup
        String circuitId = "c-1";
        String projectId = "p-1";
        String operationId = "op-1";
        int layerIdx = 2;
        User user = mockUser();
        List<ElementSelector> targetQubits = List.of(mock(ElementSelector.class));
        List<ElementSelector> controlQubits = List.of(mock(ElementSelector.class));

        QuantumCircuit circuitMock = mock(QuantumCircuit.class);
        when(circuitMock.getProjectId()).thenReturn(projectId);

        when(repository.findById(circuitId)).thenReturn(Optional.of(circuitMock));
        when(repository.save(circuitMock)).thenReturn(circuitMock);
        mockAccess(projectId, user, ProjectRole.OWNER);

        // execute
        QuantumCircuit result = service.moveQuantumOperation(circuitId, operationId, layerIdx, targetQubits, controlQubits, user);

        // verify delegation and save
        verify(circuitMock).moveQuantumOperation(operationId, layerIdx, targetQubits, controlQubits);
        verify(repository).save(circuitMock);
        assertEquals(circuitMock, result);
    }

    @Test
    void removeQuantumOperation_updatesAndSavesCircuit() {
        // setup
        String circuitId = "c-1";
        String projectId = "p-1";
        String operationId = "op-1";
        User user = mockUser();
        QuantumCircuit circuitMock = mock(QuantumCircuit.class);
        when(circuitMock.getProjectId()).thenReturn(projectId);

        when(repository.findById(circuitId)).thenReturn(Optional.of(circuitMock));
        when(repository.save(circuitMock)).thenReturn(circuitMock);
        mockAccess(projectId, user, ProjectRole.OWNER);

        // execute
        QuantumCircuit result = service.removeQuantumOperation(circuitId, operationId, user);

        // verify delegation and save
        verify(circuitMock).removeQuantumOperation(operationId);
        verify(repository).save(circuitMock);
        assertEquals(circuitMock, result);
    }

    @Test
    void updateCircuitMethods_throwException_whenCircuitNotFound() {
        // Arrange
        String circuitId = "unknown";
        User user = mockUser();
        List<ElementSelector> emptyTargets = new ArrayList<>();
        List<ElementSelector> emptyControls = new ArrayList<>();

        // Act & Assert
        CircuitNotFoundException exception = assertThrows(CircuitNotFoundException.class, () ->
            service.moveQuantumOperation(circuitId, "H", 0, emptyTargets, emptyControls, user)
        );

        // verify context data (RFC 7807)
        assertEquals("Circuit", exception.getResourceType());
        assertEquals("Circuit not found: " + circuitId, exception.getResourceId());

        // verify no save occurs
        verify(repository, never()).save(any());
    }
}
