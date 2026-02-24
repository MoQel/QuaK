package edu.kit.quak.infrastructure.user.in.web.rest.mapper;

import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.user.in.web.rest.dto.UserResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

/** Mapper for converting User domain model to DTOs. */
@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface UserDtoMapper {
    @Mapping(source = "id", target = "userId")
    UserResponse toResponse(User user);
}
