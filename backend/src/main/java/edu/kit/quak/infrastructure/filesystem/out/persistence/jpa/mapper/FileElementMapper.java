package edu.kit.quak.infrastructure.filesystem.out.persistence.jpa.mapper;


import edu.kit.quak.core.filesystem.model.*;
import edu.kit.quak.infrastructure.filesystem.out.persistence.jpa.entity.*;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.Named;
import org.mapstruct.factory.Mappers;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING) // Mapper as Spring Bean
public abstract class FileElementMapper {

    public static final FileElementMapper INSTANCE = Mappers.getMapper(FileElementMapper.class);

    // --- Domain -> JPA Entity ---

    // Basic method: Requires subclasses to implement the specific mappings or MapStruct to derive them.
    // ignore 'parent' relationship logic, as it should be managed by the adapters.
    @Mapping(target = "parent", ignore = true)
    public abstract JpaFileElement<?> toJpaEntity(FileElement<?> domain);

    @Mapping(target = "parent", ignore = true)
    @Mapping(target = "contents", source = "contents", qualifiedByName = "mapDomainSetToJpaSet")
    public abstract JpaFileElementContainer<?> toJpaContainerEntity(FileElementContainer<?> domain);

    @Mapping(target = "parent", ignore = true)
    public abstract JpaFile toJpaEntity(File domain);

    @Mapping(target = "parent", ignore = true)
    public abstract JpaProject toJpaEntity(Project domain);

    @Mapping(target = "parent", ignore = true)
    public abstract JpaDirectory toJpaEntity(Directory domain);

    // --- JPA Entity -> Domain ---

    @Mapping(target = "parent", ignore = true)
    public abstract FileElement<?> toDomainEntity(JpaFileElement<?> jpaEntity);

    @Mapping(target = "parent", ignore = true)
    @Mapping(target = "contents", source = "contents", qualifiedByName = "mapJpaSetToDomainSet")
    public abstract FileElementContainer<?> toDomainEntity(JpaFileElementContainer<?> jpaEntity);

    @Mapping(target = "parent", ignore = true)
    public abstract File toDomainEntity(JpaFile jpaEntity);

    @Mapping(target = "parent", ignore = true)
    public abstract Project toDomainEntity(JpaProject jpaEntity);

    @Mapping(target = "parent", ignore = true)
    public abstract Directory toDomainEntity(JpaDirectory jpaEntity);

    // convert polymorphic lists
    public abstract List<FileElement<?>> toDomainList(List<JpaFileElement<?>> jpaEntities);

    @Named("mapDomainSetToJpaSet")
    public Set<JpaFileElement<?>> mapDomainSetToJpaSet(Set<FileElement<?>> domainSet) {
        if (domainSet == null) return null;
        return domainSet.stream()
                .map(this::toJpaEntity)        // relies on polymorphic dispatch to concrete mapper methods
                .collect(Collectors.toSet());
    }

    @Named("mapJpaSetToDomainSet")
    public Set<FileElement<?>> mapJpaSetToDomainSet(Set<JpaFileElement<?>> jpaSet) {
        if (jpaSet == null) return null;
        return jpaSet.stream()
                .map(this::toDomainEntity)     // relies on polymorphic dispatch
                .collect(Collectors.toSet());
    }
}
