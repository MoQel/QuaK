package edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper;


import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.FileElement;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaDirectory;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaFile;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaFileElement;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaProject;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;
import org.mapstruct.Named;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;

import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public abstract class FileElementJpaMapper {
    private static final char PREFIX_PROJECT = 'p';
    private static final char PREFIX_DIRECTORY = 'd';
    private static final char PREFIX_FILE = 'f';

    @Autowired
    @Lazy
    protected FileJpaMapper fileMapper;

    @Autowired
    @Lazy
    protected DirectoryJpaMapper directoryMapper;

    @Autowired
    @Lazy
    protected ProjectJpaMapper projectMapper;

    // Map polymorph FileElement<?>
    public JpaFileElement<?> toJpaEntity(FileElement<?> domain) {
        if (domain instanceof File f) {
            return fileMapper.toJpaEntity(f);

        } else if (domain instanceof Directory d) {
            return directoryMapper.toJpaEntity(d);

        } else if (domain instanceof Project p) {
            return projectMapper.toJpaEntity(p);
        }

        throw new IllegalArgumentException(
                "Unknown FileElement subtype: " + domain.getClass()
        );
    }

    public FileElement<?> toDomainEntity(JpaFileElement<?> jpa) {
        if (jpa instanceof JpaFile f) {
            return fileMapper.toDomainEntity(f);

        } else if (jpa instanceof JpaDirectory d) {
            return directoryMapper.toDomainEntity(d);

        } else if (jpa instanceof JpaProject p) {
            return projectMapper.toDomainEntity(p);
        }

        throw new IllegalArgumentException(
                "Unknown JpaFileElement subtype: " + jpa.getClass()
        );
    }

    // Map Set required for contents
    public Set<JpaFileElement<?>> toJpaSet(Set<FileElement<?>> domainSet) {
        if (domainSet == null) return null;
        return domainSet.stream()
                .map(this::toJpaEntity)
                .collect(Collectors.toSet());
    }

    public Set<FileElement<?>> toDomainSet(Set<JpaFileElement<?>> jpaSet) {
        if (jpaSet == null) return null;
        return jpaSet.stream()
                .map(this::toDomainEntity)
                .collect(Collectors.toSet());
    }

    /**
     * From DB (UUID string) -> Domain (prefix string)
     * Used, for example, by JpaProject -> Project
     */
    @Named("addProjectPrefix")
    public String addProjectPrefix(String uuid) {
        return addPrefix(uuid, PREFIX_PROJECT);
    }

    @Named("addDirectoryPrefix")
    public String addDirectoryPrefix(String uuid) {
        return addPrefix(uuid, PREFIX_DIRECTORY);
    }

    @Named("addFilePrefix")
    public String addFilePrefix(String uuid) {
        return addPrefix(uuid, PREFIX_FILE);
    }

    /**
     * From domain (prefix string) -> DB (UUID string)
     * Removes the prefix before saving/searching
     */
    @Named("removePrefix")
    public String removePrefix(String domainId) {
        if (domainId == null || domainId.length() < 2) {
            return domainId; // Oder null, je nach Anforderung
        }

        if (domainId.indexOf('-') == 1) {
            return domainId.substring(2);
        }

        return domainId.substring(1);
    }

    private String addPrefix(String uuid, char prefix) {
        if (uuid == null) return null;
        return prefix + "-" + uuid;
    }
}
