package edu.kit.quak.infrastructure.web.rest;

import edu.kit.quak.application.filesystem.service.FileService;
import edu.kit.quak.application.filesystem.service.UserService;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.FileElement;
import edu.kit.quak.core.filesystem.model.User;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * This controller handles all the calls to the {@code /file/} endpoint.
 * See the API-documentation for further information.
 *
 * @author Henrik K
 */
@RestController
@RequestMapping("/api/file")
public class FileController {

    private final FileService fileService;
    private final UserService userService;

    public FileController(FileService fileService, UserService userService) {
        this.fileService = fileService;
        this.userService = userService;
    }

    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/")
    @PreAuthorize("isAuthenticated()")
    public FileElement<?> newFile(@RequestBody Map<String, Object> obj, @RequestHeader(name = "parent-id") String parent, Authentication authentication) {
        User user = userService.getAuthenticatedUser(authentication);
        return fileService.createFileElement(obj, parent, user);
    }

    @GetMapping("/{fId}")
    @PreAuthorize("isAuthenticated()")
    public FileElement<?> retrieveFile(@PathVariable String fId, Authentication authentication) {
        User user = userService.getAuthenticatedUser(authentication);
        return fileService.getFileElement(fId, user);
    }

    @DeleteMapping("/{fId}")
    @Transactional
    @PreAuthorize("isAuthenticated()")
    public void deleteFile(@PathVariable String fId, Authentication authentication) {
        User user = userService.getAuthenticatedUser(authentication);
        fileService.deleteFileElement(fId, user);
    }

    @PatchMapping("/{fId}")
    @PreAuthorize("isAuthenticated()")
    public void patchFileElement(@PathVariable String fId, @RequestBody Map<String, Object> body, Authentication authentication) {
        User user = userService.getAuthenticatedUser(authentication);
        fileService.patchFileElement(fId, body, user);
    }

    @GetMapping("/{fId}/content")
    @PreAuthorize("isAuthenticated()")
    public byte[] getFileContent(@PathVariable String fId, HttpServletResponse response, Authentication authentication) {
        User user = userService.getAuthenticatedUser(authentication);
        File file = fileService.getFile(fId, user);
        response.setContentType(file.getContentType());
        return file.getContent();
    }

    @PutMapping("/{fId}/content")
    @PreAuthorize("isAuthenticated()")
    public void setFileContent(@PathVariable String fId, @RequestBody byte[] content, @RequestHeader("Content-Type") String contentType, Authentication authentication) {
        User user = userService.getAuthenticatedUser(authentication);
        fileService.updateFileContent(fId, content, contentType, user);
    }
}
