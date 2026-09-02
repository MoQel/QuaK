// @quak/circuit-core. Shared domain layer: DTOs, gate types, wire index, angle formatting,
// support matrix. The notation mappers stay out of this barrel so importing a DTO does not
// pull quantikz and Dirac into the bundle.

export * from './gate-types.ts';
export * from './dto/circuit.ts';
export * from './dto/library.ts';
export * from './quantumAngle.ts';
export * from './circuitContent.ts';
export * from './circuitIndex.ts';
export * from './support-matrix.ts';
