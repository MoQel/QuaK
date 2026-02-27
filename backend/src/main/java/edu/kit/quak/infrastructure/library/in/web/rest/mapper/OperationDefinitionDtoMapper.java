package edu.kit.quak.infrastructure.library.in.web.rest.mapper;

import edu.kit.quak.core.library.model.OperationDefinition;
import edu.kit.quak.infrastructure.library.in.web.rest.dto.OperationDefinitionResponse;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface OperationDefinitionDtoMapper {
    OperationDefinitionResponse toResponse(OperationDefinition operationDefinition);

    List<OperationDefinitionResponse> toResponseList(List<OperationDefinition> operationDefinition);
}
