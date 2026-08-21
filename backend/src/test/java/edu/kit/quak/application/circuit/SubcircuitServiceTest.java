package edu.kit.quak.application.circuit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import edu.kit.quak.application.circuit.ports.out.CircuitRepositoryPort;
import edu.kit.quak.application.circuit.services.SubcircuitService;
import edu.kit.quak.application.filesystem.ports.in.FileServicePort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.SubcircuitOption;
import edu.kit.quak.core.circuit.model.layer.Layer;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.SubcircuitOperation;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.shared.tags.UnitTest;
import java.util.ArrayList;
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
class SubcircuitServiceTest {

    private static final String PROJECT = "p-1";

    @Mock
    private CircuitRepositoryPort circuitRepository;

    @Mock
    private FileServicePort fileService;

    @InjectMocks
    private SubcircuitService service;

    private final User user = new User();

    private static QuantumCircuit offeredCircuit(String projectId, String fileId) {
        QuantumCircuit circuit = circuitOf(projectId, fileId);
        circuit.setOfferedAsSubcircuit(true);
        return circuit;
    }

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

    @Test
    void listsTheProjectsOtherCircuitsWithTheirWireCount() {
        QuantumCircuit other = offeredCircuit(PROJECT, "f-1");
        other.addRegister(new QuantumRegister("q", 3));
        when(circuitRepository.findAllByProjectId(PROJECT)).thenReturn(List.of(other));
        when(circuitRepository.findById("c-1")).thenReturn(Optional.of(other));
        when(fileService.retrieveFile("f-1", user)).thenReturn(new File("bell.qasm", "d-1"));

        assertEquals(List.of(new SubcircuitOption("c-1", "f-1", "bell.qasm", 3, 0)), service.listAvailable(PROJECT, null, user));
    }

    @Test
    void doesNotOfferTheCircuitBeingEdited() {
        // A circuit containing itself would be endless; the editor must not even offer it.
        when(circuitRepository.findAllByProjectId(PROJECT)).thenReturn(List.of(offeredCircuit(PROJECT, "f-1")));

        assertTrue(service.listAvailable(PROJECT, "c-1", user).isEmpty());
        verify(fileService, never()).retrieveFile(any(), any());
    }

    @Test
    void doesNotOfferACircuitWhoseFileTheUserCannotRead() {
        QuantumCircuit other = offeredCircuit(PROJECT, "f-1");
        when(circuitRepository.findAllByProjectId(PROJECT)).thenReturn(List.of(other));
        when(circuitRepository.findById("c-1")).thenReturn(Optional.of(other));
        when(fileService.retrieveFile("f-1", user)).thenThrow(new RuntimeException("denied"));

        assertTrue(service.listAvailable(PROJECT, null, user).isEmpty());
    }

    @Test
    void doesNotOfferACircuitNobodyDeclaredToBeOne() {
        // A circuit exists as soon as its file is opened. Offering it on that basis alone put the
        // user's main circuit in the list of building blocks, which is not something they chose.
        when(circuitRepository.findAllByProjectId(PROJECT)).thenReturn(List.of(circuitOf(PROJECT, "f-1")));

        assertTrue(service.listAvailable(PROJECT, "editing", user).isEmpty());
        verify(fileService, never()).retrieveFile(any(), any());
    }

    @Test
    void doesNotOfferACircuitThatWouldCloseALoop() {
        // main -> sub already exists, so offering main inside sub would make the two reference each
        // other. Expanding that pair afterwards would not terminate.
        QuantumCircuit main = offeredCircuitCalling("main", "f-main", "sub");
        when(circuitRepository.findAllByProjectId(PROJECT)).thenReturn(List.of(main));

        assertTrue(service.listAvailable(PROJECT, "sub", user).isEmpty());
    }

    @Test
    void offersACircuitThatDoesNotLeadBack() {
        QuantumCircuit helper = offeredCircuit(PROJECT, "f-1");
        when(circuitRepository.findAllByProjectId(PROJECT)).thenReturn(List.of(helper));
        when(circuitRepository.findById("c-1")).thenReturn(Optional.of(helper));
        when(fileService.retrieveFile("f-1", user)).thenReturn(new File("bell.qasm", "d-1"));

        assertEquals(1, service.listAvailable(PROJECT, "somewhere-else", user).size());
    }

    @Test
    void doesNotOfferACircuitThatLoopsBackIndirectly() {
        // a -> b -> editing: offering a inside "editing" closes the loop one step further out.
        QuantumCircuit a = offeredCircuitCalling("a", "f-a", "b");
        QuantumCircuit b = offeredCircuitCalling("b", "f-b", "editing");
        when(circuitRepository.findAllByProjectId(PROJECT)).thenReturn(List.of(a, b));

        assertTrue(service.listAvailable(PROJECT, "editing", user).isEmpty());
    }

    @Test
    void declaringACircuitTwiceChangesNothing() {
        QuantumCircuit already = offeredCircuit(PROJECT, "f-1");
        when(circuitRepository.findById("c-1")).thenReturn(Optional.of(already));

        service.offerAsSubcircuit("c-1", user);

        verify(circuitRepository, never()).save(any());
    }

    @Test
    void declaringACircuitStoresTheFlag() {
        QuantumCircuit plain = circuitOf(PROJECT, "f-1");
        when(circuitRepository.findById("c-1")).thenReturn(Optional.of(plain));

        service.offerAsSubcircuit("c-1", user);

        assertTrue(plain.isOfferedAsSubcircuit());
        verify(circuitRepository).save(plain);
    }

    /** A circuit that is offered as a subcircuit and itself calls the given one. */
    private static QuantumCircuit offeredCircuitCalling(String id, String fileId, String callsCircuitId) {
        QuantumOperation call = new SubcircuitOperation(
            false,
            new ArrayList<>(List.of(new ElementSelector("reg", 0))),
            new ArrayList<>(),
            callsCircuitId
        );
        QuantumCircuit circuit = QuantumCircuit.builder()
            .id(id)
            .projectId(PROJECT)
            .fileId(fileId)
            .offeredAsSubcircuit(true)
            .registers(List.of())
            .layers(List.of(new Layer(new ArrayList<>(List.of(call)))))
            .build();
        return circuit;
    }
}
