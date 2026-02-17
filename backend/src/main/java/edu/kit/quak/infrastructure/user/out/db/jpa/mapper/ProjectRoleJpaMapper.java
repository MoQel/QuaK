package edu.kit.quak.infrastructure.user.out.db.jpa.mapper;

import edu.kit.quak.core.user.model.ProjectRoleAssignment;
import edu.kit.quak.infrastructure.user.out.db.jpa.entity.JpaProjectRoleAssignment;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

/**
 * MapStruct mapper for converting between ProjectRoleAssignment domain model
 * and
 * JpaProjectRoleAssignment entity. All field names match between domain and JPA
 * entity, so no
 * explicit mappings are needed.
 */
@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface ProjectRoleJpaMapper {

    ProjectRoleAssignment toDomain(JpaProjectRoleAssignment jpaEntity);

    JpaProjectRoleAssignment toJpa(ProjectRoleAssignment domain);
}
