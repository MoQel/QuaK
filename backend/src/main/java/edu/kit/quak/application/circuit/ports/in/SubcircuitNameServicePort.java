package edu.kit.quak.application.circuit.ports.in;

import edu.kit.quak.core.user.model.User;
import java.util.Collection;
import java.util.Map;

public interface SubcircuitNameServicePort {
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
}
