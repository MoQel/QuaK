package edu.kit.quak.infrastructure.circuit.in.web.rest.mapper;

import edu.kit.quak.core.circuit.model.register.ClassicRegister;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.circuit.model.register.Register;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.ClassicRegisterResponse;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.QuantumRegisterResponse;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.RegisterResponse;
import org.mapstruct.*;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, nullValueCheckStrategy = NullValueCheckStrategy.ALWAYS)
public interface RegisterDtoMapper {
    @BeanMapping(subclassExhaustiveStrategy = SubclassExhaustiveStrategy.RUNTIME_EXCEPTION)
    @SubclassMapping(source = QuantumRegister.class, target = QuantumRegisterResponse.class)
    @SubclassMapping(source = ClassicRegister.class, target = ClassicRegisterResponse.class)
    RegisterResponse toResponse(Register register);

    /**
     * Maps a register DTO back to the domain. Provided ids are kept so that
     * element selectors referencing the register stay valid; missing ids fall
     * back to the freshly generated one.
     */
    @BeanMapping(subclassExhaustiveStrategy = SubclassExhaustiveStrategy.RUNTIME_EXCEPTION)
    @SubclassMapping(source = QuantumRegisterResponse.class, target = QuantumRegister.class)
    @SubclassMapping(source = ClassicRegisterResponse.class, target = ClassicRegister.class)
    Register toDomain(RegisterResponse dto);
}
