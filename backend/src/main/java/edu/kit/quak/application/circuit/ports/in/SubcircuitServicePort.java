package edu.kit.quak.application.circuit.ports.in;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.SubcircuitOption;
import edu.kit.quak.core.user.model.User;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface SubcircuitServicePort {
    /**
     * Display names for the circuits the given ids point at, keyed by id.
     *
     * <p>The name is the file the referenced circuit belongs to. It is derived on every read rather
     * than stored with the operation, so renaming the file cannot leave a stale name behind.
     *
     * <p>An id is simply absent from the result when it names no circuit, when that circuit belongs
     * to a different project, or when it has no file. That is deliberate rather than an error: a
     * subcircuit's target is client-supplied, so a caller must not be able to learn whether an
     * arbitrary id exists, let alone what it is called.
     *
     * @param projectId the project the referencing circuit belongs to; ids outside it are ignored
     */
    Map<String, String> resolveNames(Collection<String> circuitIds, String projectId, User user);

    /**
     * The circuits of the project that can be dropped in as a subcircuit.
     *
     * <p>Only circuits that already exist are listed - unlike reading a circuit by file, this
     * creates nothing, so opening the library does not quietly give every file in the project a
     * circuit of its own.
     *
     * @param excludeCircuitId the circuit being edited; a circuit cannot contain itself
     */
    /**
     * The circuit a subcircuit call points at, or empty when it cannot be read.
     *
     * <p>Bounded to the calling circuit's project for the same reason the name lookup is: the id
     * comes from the client, so without the check a crafted circuit could read foreign circuits.
     */
    Optional<QuantumCircuit> resolveDefinition(String circuitId, String projectId, User user);

    List<SubcircuitOption> listAvailable(String projectId, String excludeCircuitId, User user);

    /**
     * Declares a circuit to be available as a building block elsewhere in the project.
     *
     * <p>Needed because a circuit exists as soon as its file is opened: without an explicit
     * declaration the library could only guess, and would offer every file the user ever looked at.
     * Calling it twice is harmless.
     */
    void offerAsSubcircuit(String circuitId, User user);
}
