import {
    CircuitResponse,
    CompositeQuantumGateDto,
    ElementSelectorDto,
    getSelectorKey,
    isCompositeGate,
    QuantumOperationDto,
} from '@/api/dto/circuit.ts';

/**
 * A user-defined gate offered by the library, taken from the circuit it is called in.
 *
 * The template is a *call* of the gate, still bound to the qubits it was found on — the definition
 * itself never reaches the client. Dropping it elsewhere therefore means re-binding it, which is
 * what `rebindComposite` does at the drop site.
 */
export interface CustomGateTemplate {
    /** Distinguishes variants of one gate name; stable across renders, so usable as a React key. */
    key: string;
    /** The gate's own name as declared in the source, e.g. `"bell"`. */
    name: string;
    /** What the tile says: the name, disambiguated when several variants share it. */
    label: string;
    /** Port labels in parameter order; its length is the gate's arity. */
    portLabels: string[];
    /** A call of the gate, bound to the qubits of the site it was collected from. */
    template: CompositeQuantumGateDto;
}

/**
 * Every user-defined gate called anywhere in the circuit, ready to be dragged back in.
 *
 * A gate that is only *declared* is not in here: the parser records the declaration but builds a
 * definition on first call, so a gate nobody calls never reaches the client at all. Nested gates do
 * show up — a box inside another box is a gate in its own right, and hiding it would make the
 * library depend on how deeply someone happened to nest their code.
 */
export const collectCustomGates = (circuit: CircuitResponse | undefined): CustomGateTemplate[] => {
    if (!circuit) return [];

    const bySignature = new Map<string, CompositeQuantumGateDto>();

    const visit = (operation: QuantumOperationDto): void => {
        if (!isCompositeGate(operation)) return;

        const signature = signatureOf(operation);
        // First call wins. Later ones are the same gate on other wires; keeping the first keeps the
        // list stable while the user edits further down the circuit.
        if (!bySignature.has(signature)) bySignature.set(signature, operation);
        (operation.body ?? []).forEach(visit);
    };

    circuit.layers.forEach((layer) => layer.quantumOperations.forEach(visit));

    return withDisambiguatedLabels(Array.from(bySignature, ([key, template]) => ({ key, template })));
};

/**
 * What makes two calls the same gate: the name, the parameter list, and the body — with every qubit
 * written as the *parameter position* it binds to rather than the wire it currently sits on.
 *
 * Comparing wires would make `bell q[0], q[1]` and `bell q[2], q[3]` two different library entries.
 * The inversion is sound because a call may not pass the same qubit twice, so a qubit's position in
 * `targetQubits` **is** its parameter index — the same rule the backend uses to rebuild a definition
 * from a stored call.
 *
 * <p>The body has to be part of this. One gate name can carry several definitions when the gate is
 * parametrized (`gate rot(a) q { rx(a) q; }` called with π/4 and π/2 yields two), and the backend's
 * code generator separates exactly those, by name plus rendered body, when it emits declarations.
 */
const signatureOf = (gate: CompositeQuantumGateDto): string => {
    const parameterIndexOf = new Map(gate.targetQubits.map((qubit, position) => [getSelectorKey(qubit), position]));

    // A body operation may only address the gate's own parameters, so an unknown selector means the
    // call is malformed. It is kept verbatim rather than dropped, so two malformed calls that differ
    // still compare as different instead of silently collapsing into one entry.
    const renderSelector = (selector: ElementSelectorDto): string =>
        String(parameterIndexOf.get(getSelectorKey(selector)) ?? `@${getSelectorKey(selector)}`);

    const renderOperation = (operation: QuantumOperationDto): string => {
        const controls = operation.controlQubits.map(renderSelector).join(',');
        const targets = operation.targetQubits.map(renderSelector).join(',');
        const angle = 'rotationAngle' in operation ? `(${operation.rotationAngle})` : '';
        // A nested gate is compared as a gate, not just by name: its own body is what tells two
        // same-named variants apart, exactly as one level up.
        const nested = isCompositeGate(operation) ? signatureOf(operation) : '';
        return `${operation.identifier}${angle}${nested}[${controls}->${targets}]`;
    };

    const body = (gate.body ?? []).map(renderOperation).join(';');
    return `${gate.identifier}(${(gate.portLabels ?? []).join(',')}){${body}}`;
};

/**
 * Gives every tile a label the user can tell apart.
 *
 * Variants of one name are a real case (a parametrized gate called with two different angles), and
 * two identically labelled tiles would be a coin flip. The suffix mirrors the `_2` the backend's
 * code generator appends when it has to declare the same name twice.
 */
const withDisambiguatedLabels = (gates: { key: string; template: CompositeQuantumGateDto }[]): CustomGateTemplate[] => {
    const seenPerName = new Map<string, number>();

    return gates.map(({ key, template }) => {
        const name = template.identifier;
        const occurrence = (seenPerName.get(name) ?? 0) + 1;
        seenPerName.set(name, occurrence);

        return {
            key,
            name,
            label: occurrence === 1 ? name : `${name} (${occurrence})`,
            portLabels: template.portLabels ?? [],
            template,
        };
    });
};
