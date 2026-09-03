package edu.kit.quak.application.circuit.services;

import edu.kit.quak.application.circuit.ports.out.QasmIncludeLoader;
import edu.kit.quak.application.circuit.ports.out.QasmSource;
import edu.kit.quak.application.common.exceptions.AccessDeniedException;
import edu.kit.quak.application.filesystem.delegator.FileElementContainerRepositoryDelegator;
import edu.kit.quak.application.filesystem.ports.out.FileContentRepositoryPort;
import edu.kit.quak.application.filesystem.ports.out.FileRepositoryPort;
import edu.kit.quak.application.user.ports.in.ProjectRoleServicePort;
import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.FileElement;
import edu.kit.quak.core.filesystem.model.FileElementContainer;
import edu.kit.quak.core.user.model.ProjectRole;
import edu.kit.quak.core.user.model.User;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Resolves {@code include "..."} targets against the project's own file tree, so a circuit file can
 * pull in gate definitions from a sibling file.
 *
 * <p>Paths are relative to the directory of the including file and may descend into subdirectories
 * ({@code "lib/bell.qasm"}) or walk up with {@code ".."}. Names are matched case-insensitively,
 * matching how the filesystem domain enforces uniqueness within a directory.
 *
 * <p>Access is checked per include against the project containing the including file. Because the
 * first lookup happens for the file the parse started from, a caller cannot use a foreign
 * {@code fileId} to probe another user's project.
 */
@Slf4j
@Service
public class ProjectQasmIncludeResolver {

    private final FileRepositoryPort fileRepository;
    private final FileContentRepositoryPort contentRepository;
    private final FileElementContainerRepositoryDelegator delegator;
    private final ProjectRoleServicePort roleService;

    public ProjectQasmIncludeResolver(
        FileRepositoryPort fileRepository,
        FileContentRepositoryPort contentRepository,
        FileElementContainerRepositoryDelegator delegator,
        ProjectRoleServicePort roleService
    ) {
        this.fileRepository = fileRepository;
        this.contentRepository = contentRepository;
        this.delegator = delegator;
        this.roleService = roleService;
    }

    /**
     * Binds this resolver to a user, yielding the loader the parser uses. Returns
     * {@link QasmIncludeLoader#NONE} when there is no file to resolve against, which turns any
     * non-standard include into a clear parse error rather than a silently empty circuit.
     */
    @Transactional(readOnly = true)
    public QasmIncludeLoader forUser(User user) {
        return (fromFileId, path) -> {
            if (fromFileId == null || fromFileId.isBlank()) {
                return Optional.empty();
            }
            return resolve(fromFileId, path, user);
        };
    }

    private Optional<QasmSource> resolve(String fromFileId, String path, User user) {
        Optional<File> includingFile = fileRepository.findById(fromFileId);
        if (includingFile.isEmpty()) {
            return Optional.empty();
        }
        verifyAccess(includingFile.get().getParentId(), user);

        return findContainer(includingFile.get().getParentId())
            .flatMap(directory -> walkToTarget(directory, path))
            .flatMap(this::toSource);
    }

    /** Walks the {@code /}-separated path segments, returning the file the last segment names. */
    private Optional<File> walkToTarget(FileElementContainer<?> startDirectory, String path) {
        String[] segments = path.split("/");
        FileElementContainer<?> current = startDirectory;

        for (int i = 0; i < segments.length - 1; i++) {
            Optional<FileElementContainer<?>> next = descend(current, segments[i]);
            if (next.isEmpty()) {
                return Optional.empty();
            }
            current = next.get();
        }
        return childByName(current, segments[segments.length - 1]).filter(File.class::isInstance).map(File.class::cast);
    }

    /** Resolves one non-final path segment to a directory, honoring {@code .} and {@code ..}. */
    private Optional<FileElementContainer<?>> descend(FileElementContainer<?> current, String segment) {
        if (segment.isEmpty() || ".".equals(segment)) {
            return Optional.of(current);
        }
        if ("..".equals(segment)) {
            // Stops at the project root: a project has no parent, so ".." there resolves to nothing.
            return findContainer(current.getParentId());
        }
        return childByName(current, segment)
            .filter(Directory.class::isInstance)
            .map(child -> (FileElementContainer<?>) child);
    }

    private Optional<FileElement<?>> childByName(FileElementContainer<?> container, String name) {
        return container
            .getContents()
            .stream()
            .filter(child -> child.getName().equalsIgnoreCase(name))
            .findFirst();
    }

    private Optional<FileElementContainer<?>> findContainer(String containerId) {
        return containerId == null ? Optional.empty() : delegator.findContainerById(containerId);
    }

    private Optional<QasmSource> toSource(File file) {
        return contentRepository
            .loadContent(file.getId())
            .map(content -> new QasmSource(file.getId(), file.getName(), new String(content, StandardCharsets.UTF_8)));
    }

    private void verifyAccess(String parentId, User user) {
        String projectId = delegator
            .findProjectIdByElementId(parentId)
            .orElseThrow(() -> new IllegalStateException("Could not find root project for element with ID: " + parentId));

        if (!roleService.hasMinimumRole(projectId, user.getId(), ProjectRole.VIEWER)) {
            log.debug("Access denied while resolving include: user '{}' has no role on project '{}'", user.getId(), projectId);
            throw new AccessDeniedException("file", parentId);
        }
    }
}
