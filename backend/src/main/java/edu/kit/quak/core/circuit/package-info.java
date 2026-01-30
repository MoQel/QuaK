/**
 * This package implements the quantum circuit metamodel proposed by Gemeinhardt et al. (2024),
 * "A Model-Driven Framework for Composition-Based Quantum Circuit Design".
 *
 * <p>The implementation follows the structure and core concepts of the original metamodel,
 * but intentionally does not cover all aspects described in the publication.
 *
 * <p><b>Not included (planned for future features):</b>
 * <ul>
 *   <li>All composite- and loop-related classes</li>
 *   <li>All concepts related to QUBOs</li>
 *   <li>{@code StatePreparation}, {@code ClassicControl}, and {@code OperationRealization}</li>
 *   <li>The {@code reverse} attribute of {@code QuantumOperationDefinition}</li>
 * </ul>
 *
 * <p><b>Not included due to conscious implementation decisions:</b>
 * <ul>
 *   <li>{@code NamedElement} is replaced by {@code ElementWithId}, as naming is currently not
 *       required. This may change in the future (e.g., when supporting multiple circuits per
 *       project with tab-based navigation).</li>
 *   <li>The metamodel distinction between {@code ElementSelector} and {@code RangeSelector}
 *       with a common abstract {@code Selector} superclass is not adopted. Only
 *       {@code ElementSelector} is implemented, as all current use cases of a range selector
 *       can be expressed by multiple element selectors, and the practical necessity of a
 *       dedicated range selector is considered minimal.</li>
 *   <li>{@code ElementSelector} and {@code QuantumOperation} extend {@code ElementWithId} to
 *       simplify persistence and database storage.</li>
 *   <li>{@code ElementSelector} stores exactly one register ID instead maintaining a list of
 *       register objects. Since an element selector operates on a single qubit, register
 *       overlaps caused by range-based selection are structurally excluded. Not referencing
 *       actual register objects allows DTO mappers to construct models independently.</li>
 *   <li>{@code QuantumOperationLibrary} is implemented as an {@code enum}, as this proved to be
 *       a practical and robust representation for storing available operations.</li>
 *   <li>The parameters {@code theta}, {@code phi}, and {@code lambda} are unified into a single
 *       {@code rotationAngle} parameter, as one angle is sufficient for X-, Y-, and Z-rotation gates.</li>
 * </ul>
 *
 * <p>Reference: F. Gemeinhardt, A. Garmendia, M. Wimmer, R. Wille,
 * "A Model-Driven Framework for Composition-Based Quantum Circuit Design",
 * Johannes Kepler University Linz, 2024.
 *
 * @see <a href="https://dl.acm.org/doi/10.1145/3688856">
 *     ACM Digital Library: A Model-Driven Framework for Composition-Based Quantum Circuit Design
 * </a>
 */
package edu.kit.quak.core.circuit;
