package edu.kit.quak.security;

import edu.kit.quak.security.model.User;
import edu.kit.quak.security.model.UserDto;
import edu.kit.quak.security.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(HttpSession session) {
        UUID userId = (UUID) session.getAttribute("userId");
        if (userId == null) {
            // Should be handled by SecurityConfig, but double check
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return ResponseEntity.ok(new UserDto(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getAvatarUrl(),
                user.getEmailVerified()
        ));
    }
}
