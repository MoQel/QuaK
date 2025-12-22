package edu.kit.quak.infrastructure.user.out.db.jpa.mapper;

import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.user.out.db.jpa.entity.JpaUser;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

/**
 * MapStruct mapper for converting between User domain model and JpaUser entity.
 * All field names match between domain and JPA entity, so no explicit mappings
 * are needed.
 */
@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface UserJpaMapper {

    User toDomain(JpaUser jpaUser);

    JpaUser toJpa(User user);
}
