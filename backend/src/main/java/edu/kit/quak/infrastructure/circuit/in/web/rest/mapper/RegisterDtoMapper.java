package edu.kit.quak.infrastructure.circuit.in.web.rest.mapper;

import edu.kit.quak.core.circuit.model.register.ClassicRegister;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.circuit.model.register.Register;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.ClassicRegisterResponse;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.QuantumRegisterResponse;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.RegisterResponse;
import org.mapstruct.*;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface RegisterDtoMapper {
    @BeanMapping(subclassExhaustiveStrategy = SubclassExhaustiveStrategy.RUNTIME_EXCEPTION)
    @SubclassMapping(source = QuantumRegister.class, target = QuantumRegisterResponse.class)
    @SubclassMapping(source = ClassicRegister.class, target = ClassicRegisterResponse.class)
    RegisterResponse toResponse(Register register);
}
