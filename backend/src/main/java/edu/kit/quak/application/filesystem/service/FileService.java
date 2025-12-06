package edu.kit.quak.application.filesystem.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.FileElement;
import edu.kit.quak.core.filesystem.model.User;
import edu.kit.quak.files.repository.FileRepository;
import edu.kit.quak.files.repository.RepoMonad;
import edu.kit.quak.files.repository.savers.FileElementSaver;
import edu.kit.quak.files.repository.savers.FileElementSaversRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

import static edu.kit.quak.core.filesystem.model.FileElement.TYPE_FIELD;
import static org.springframework.http.HttpStatus.BAD_REQUEST;

/**
 * Service for file-related business logic.
 * Handles file operations such as creation, retrieval, deletion, and content management.
 *
 * @author QuaK Team
 */
@Service
public class FileService {

    private static final Class<?>[] FILTER = {File.class, Directory.class};

    private final FileRepository fileRepository;
    private final ObjectMapper objectMapper;
    private final FileElementSaversRepository savers;
    private final UserService userService;

    public FileService(FileRepository fileRepository, ObjectMapper objectMapper, 
                      FileElementSaversRepository savers, UserService userService) {
        this.fileRepository = fileRepository;
        this.objectMapper = objectMapper;
        this.savers = savers;
        this.userService = userService;
    }

    /**
     * Creates a new file element under the specified parent.
     *
     * @param obj The file element data as a map
     * @param parentId The ID of the parent directory or project
     * @param user The user creating the file
     * @return The created file element
     * @throws ResponseStatusException if the parent is not found or the object type is invalid
     */
    public FileElement<?> createFileElement(Map<String, Object> obj, String parentId, User user) {
        // Verify parent exists and user has ownership
        savers.getSaverForElementId(parentId)
              .map(FileElementSaver::getRepository)
              .flatMap(repo -> repo.findById(parentId))
              .ifPresentOrElse(
                  element -> userService.verifyOwnership(element, user),
                  () -> { throw new ResponseStatusException(BAD_REQUEST, "No matching parent found"); }
              );

        // Get the destination repository
        final RepoMonad<?> dest = savers.getSaverForElementId(parentId)
                                        .flatMap(FileElementSaver::getRepoMonad)
                                        .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "No matching parent found"));
        
        // Create and save the new element
        return savers.getSaverForTypeName(obj.getOrDefault(TYPE_FIELD, "").toString(), FILTER)
                     .map(s -> {
                    try {
                        return s.mapAndSaveNew(objectMapper, obj, element -> dest.addAndSave(parentId, element));
                    } catch (IllegalArgumentException e) {
                        throw new ResponseStatusException(BAD_REQUEST, e.getMessage());
                    }
                })
                     .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Given object type can not be saved under this endpoint"));
    }

    /**
     * Retrieves a file element by its ID.
     *
     * @param fileId The ID of the file element
     * @param user The user requesting the file
     * @return The file element
     * @throws ResponseStatusException if the file is not found
     */
    public FileElement<?> getFileElement(String fileId, User user) {
        FileElement<?> element = savers.getSaverForElementId(fileId, FILTER)
                .map(FileElementSaver::getRepository)
                .flatMap(repo -> repo.findById(fileId))
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "No matching FileElement found for id"));
        
        userService.verifyOwnership(element, user);
        return element;
    }

    /**
     * Deletes a file element by its ID.
     *
     * @param fileId The ID of the file element to delete
     * @param user The user deleting the file
     * @throws ResponseStatusException if the file is not found or deletion fails
     */
    public void deleteFileElement(String fileId, User user) {
        savers.getSaverForElementId(fileId, FILTER)
              .map(FileElementSaver::getRepository)
              .flatMap(repo -> repo.findById(fileId))
              .ifPresent(element -> userService.verifyOwnership(element, user));

        try {
            savers.delete(fileId, FILTER);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * Patches (partially updates) a file element.
     *
     * @param fileId The ID of the file element to patch
     * @param body The patch data
     * @param user The user patching the file
     * @throws ResponseStatusException if the file is not found or patching fails
     */
    public void patchFileElement(String fileId, Map<String, Object> body, User user) {
        savers.getSaverForElementId(fileId, FILTER)
              .map(FileElementSaver::getRepository)
              .flatMap(repo -> repo.findById(fileId))
              .ifPresent(element -> userService.verifyOwnership(element, user));

        try {
            savers.getSaverForElementId(fileId, FILTER)
                  .ifPresent(sav -> sav.patch(fileId, (toPatch, clazz) -> {
                      body.put(TYPE_FIELD, toPatch.getTypeIdentifier());
                      return objectMapper.convertValue(body, clazz);
                  }));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * Retrieves the content of a file.
     *
     * @param fileId The ID of the file
     * @param user The user requesting the content
     * @return The file object containing the content
     * @throws ResponseStatusException if the file is not found
     */
    public File getFile(String fileId, User user) {
        File file = fileRepository.findById(fileId).orElseThrow(
                () -> new ResponseStatusException(BAD_REQUEST, "Given file-ID does not resolve to an existing file.")
        );
        userService.verifyOwnership(file, user);
        return file;
    }

    /**
     * Updates the content of a file.
     *
     * @param fileId The ID of the file
     * @param content The new content
     * @param contentType The content type
     * @param user The user updating the content
     * @throws ResponseStatusException if the file is not found
     */
    public void updateFileContent(String fileId, byte[] content, String contentType, User user) {
        File file = fileRepository.findById(fileId).orElseThrow(
                () -> new ResponseStatusException(BAD_REQUEST, "Given file-ID does not resolve to an existing file.")
        );
        userService.verifyOwnership(file, user);

        file.setContent(content);
        file.setContentType(contentType);
        file.setLastAccessNow();
        fileRepository.save(file);
    }
}
