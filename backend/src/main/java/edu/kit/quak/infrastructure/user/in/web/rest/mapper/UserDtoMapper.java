package edu.kit.quak.infrastructure.user.in.web.rest.mapper;

import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.user.in.web.rest.dto.UserResponse;
import org.springframework.stereotype.Component;

/**
 * Mapper for converting User domain model to DTOs.
 */
@Component
public class UserDtoMapper {
    
    public UserResponse toResponse(User user) {
        return new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getName(),
            user.getAvatarUrl(),
            user.getEmailVerified()
        );
    }
}
