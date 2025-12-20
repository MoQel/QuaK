# Comprehensive Merge Strategy

## Merging `feature/32-feature-user-persistence-store-oidc-profile-with-mariadb` into `feature/57-feature-backend-architektur-refactoring-ports-adapters`

---

## Table of Contents
1. [Overview](#overview)
2. [Pre-Merge Preparation](#pre-merge-preparation)
3. [Phase 1: Create User Domain in Hexagonal Architecture](#phase-1-create-user-domain-in-hexagonal-architecture)
4. [Phase 2: Configuration & Infrastructure Changes](#phase-2-configuration--infrastructure-changes)
5. [Phase 3: Security Integration](#phase-3-security-integration)
6. [Phase 4: Frontend Changes](#phase-4-frontend-changes)
7. [Phase 5: Testing](#phase-5-testing)
8. [Phase 6: Cleanup](#phase-6-cleanup)
9. [Files Reference](#files-reference)

---

## Overview

### The Challenge
The two branches have **diverged significantly** from their common ancestor (`f526e7e`):
- **Base branch (`feature/57`)**: Complete hexagonal architecture refactoring with 80+ new files
- **Feature branch (`feature/32`)**: User persistence features built on the OLD architecture

### Strategy: "Cherry-Pick & Refactor"
Instead of a direct merge (which would cause massive conflicts), we will:
1. Stay on the **base branch** (`feature/57`)
2. **Manually recreate** the user persistence features from `feature/32`
3. **Adapt** them to follow the hexagonal architecture pattern
4. **Cherry-pick** non-conflicting changes (frontend, config)

---

## Pre-Merge Preparation

### Step 1: Ensure Clean Working State
```bash
cd /home/furki/Master\ of\ Science/WS25-26/Praktikum/QuaK

# Ensure you're on the base branch
git checkout feature/57-feature-backend-architektur-refactoring-ports-adapters

# Stash any uncommitted changes
git stash

# Create a backup branch
git checkout -b feature/merge-user-persistence-backup

# Go back to working branch
git checkout feature/57-feature-backend-architektur-refactoring-ports-adapters
```

### Step 2: Create Feature Branch for Merge Work
```bash
# Create new branch for the merge work
git checkout -b feature/user-persistence-hexagonal
```

---

## Phase 1: Create User Domain in Hexagonal Architecture

The user functionality needs to be restructured to follow the ports & adapters pattern.

### 1.1 Create Domain Model (Core Layer)

**Location**: `backend/src/main/java/edu/kit/quak/core/user/model/`

#### File: `User.java` (Pure POJO - NO JPA annotations!)
```java
package edu.kit.quak.core.user.model;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain model representing a User.
 * This is a pure POJO with no infrastructure dependencies.
 */
public class User {
    private UUID id;
    private String issuer;
    private String sub;
    private String email;
    private Boolean emailVerified;
    private String name;
    private String givenName;
    private String familyName;
    private String avatarUrl;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant lastLoginAt;

    // Constructors
    public User() {}

    public User(UUID id, String issuer, String sub) {
        this.id = id;
        this.issuer = issuer;
        this.sub = sub;
    }

    // Getters and Setters (all of them)
    // ... (copy from feature/32 but remove JPA annotations)
    
    // Business Methods
    public void updateFromOidc(String email, Boolean emailVerified, String name, 
                               String givenName, String familyName, String avatarUrl) {
        this.email = email;
        this.emailVerified = emailVerified;
        this.name = name;
        this.givenName = givenName;
        this.familyName = familyName;
        this.avatarUrl = avatarUrl;
        this.lastLoginAt = Instant.now();
    }

    public static User createFromOidc(String issuer, String sub, String email, 
                                       Boolean emailVerified, String name, 
                                       String givenName, String familyName, 
                                       String avatarUrl) {
        User user = new User();
        user.setIssuer(issuer);
        user.setSub(sub);
        user.setEmail(email);
        user.setEmailVerified(emailVerified);
        user.setName(name);
        user.setGivenName(givenName);
        user.setFamilyName(familyName);
        user.setAvatarUrl(avatarUrl);
        user.setLastLoginAt(Instant.now());
        return user;
    }
}
```

### 1.2 Create Application Layer (Ports & Services)

**Location**: `backend/src/main/java/edu/kit/quak/application/user/`

#### File: `ports/in/UserServicePort.java`
```java
package edu.kit.quak.application.user.ports.in;

import edu.kit.quak.core.user.model.User;
import org.springframework.security.core.Authentication;

import java.util.Optional;
import java.util.UUID;

/**
 * Input port defining user-related use cases.
 */
public interface UserServicePort {
    User getAuthenticatedUser(Authentication authentication);
    Optional<User> findById(UUID id);
    Optional<User> findByIssuerAndSub(String issuer, String sub);
}
```

#### File: `ports/in/OidcSyncServicePort.java`
```java
package edu.kit.quak.application.user.ports.in;

import edu.kit.quak.core.user.model.User;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

/**
 * Input port for OIDC user synchronization.
 */
public interface OidcSyncServicePort {
    User syncUser(String issuer, OidcUser oidcUser);
}
```

#### File: `ports/in/AuthServicePort.java`
```java
package edu.kit.quak.application.user.ports.in;

import jakarta.servlet.http.HttpSession;
import java.util.Map;

/**
 * Input port for authentication operations.
 */
public interface AuthServicePort {
    Map<String, Object> getAuthenticationStatus();
    Map<String, Object> getAuthenticatedUserInfo();
    Map<String, String> logout(HttpSession session);
}
```

#### File: `ports/out/UserRepositoryPort.java`
```java
package edu.kit.quak.application.user.ports.out;

import edu.kit.quak.core.user.model.User;

import java.util.Optional;
import java.util.UUID;

/**
 * Output port for user persistence operations.
 */
public interface UserRepositoryPort {
    User save(User user);
    Optional<User> findById(UUID id);
    Optional<User> findByIssuerAndSub(String issuer, String sub);
    void deleteById(UUID id);
}
```

#### File: `services/UserService.java`
```java
package edu.kit.quak.application.user.services;

import edu.kit.quak.application.user.ports.in.UserServicePort;
import edu.kit.quak.application.user.ports.out.UserRepositoryPort;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.core.filesystem.model.FileElement;
import edu.kit.quak.core.filesystem.model.Project;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class UserService implements UserServicePort {

    private final UserRepositoryPort userRepository;

    public UserService(UserRepositoryPort userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public User getAuthenticatedUser(Authentication authentication) {
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OidcUser oidcUser = (OidcUser) authentication.getPrincipal();
        
        String registrationId = oauthToken.getAuthorizedClientRegistrationId();
        String sub = oidcUser.getSubject();
        
        return userRepository.findByIssuerAndSub(registrationId, sub)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "User not found in database"));
    }

    @Override
    public Optional<User> findById(UUID id) {
        return userRepository.findById(id);
    }

    @Override
    public Optional<User> findByIssuerAndSub(String issuer, String sub) {
        return userRepository.findByIssuerAndSub(issuer, sub);
    }

    // Ownership verification methods
    public void verifyOwnership(FileElement<?> element, User user) {
        Project project = element.findProject()
                .orElseThrow(() -> new ResponseStatusException(FORBIDDEN, 
                    "Access denied: Element is not associated with a project"));
        verifyOwnership(project, user);
    }

    public void verifyOwnership(Project project, User user) {
        if (project.getOwner() == null || !project.getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(FORBIDDEN, 
                "Access denied: You do not have permission to access this resource");
        }
    }
}
```

#### File: `services/OidcUserSyncService.java`
```java
package edu.kit.quak.application.user.services;

import edu.kit.quak.application.user.ports.in.OidcSyncServicePort;
import edu.kit.quak.application.user.ports.out.UserRepositoryPort;
import edu.kit.quak.core.user.model.User;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OidcUserSyncService implements OidcSyncServicePort {

    private final UserRepositoryPort userRepository;

    public OidcUserSyncService(UserRepositoryPort userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public User syncUser(String issuer, OidcUser oidcUser) {
        String sub = oidcUser.getSubject();
        if (sub == null) {
            throw new IllegalArgumentException("Subject (sub) claim is missing");
        }

        return userRepository.findByIssuerAndSub(issuer, sub)
                .map(existingUser -> updateUser(existingUser, oidcUser))
                .orElseGet(() -> createUser(issuer, sub, oidcUser));
    }

    private User updateUser(User user, OidcUser oidcUser) {
        user.updateFromOidc(
            oidcUser.getEmail(),
            oidcUser.getEmailVerified(),
            oidcUser.getFullName(),
            oidcUser.getGivenName(),
            oidcUser.getFamilyName(),
            oidcUser.getPicture()
        );
        return userRepository.save(user);
    }

    private User createUser(String issuer, String sub, OidcUser oidcUser) {
        User user = User.createFromOidc(
            issuer, sub,
            oidcUser.getEmail(),
            oidcUser.getEmailVerified(),
            oidcUser.getFullName(),
            oidcUser.getGivenName(),
            oidcUser.getFamilyName(),
            oidcUser.getPicture()
        );
        return userRepository.save(user);
    }
}
```

#### File: `services/AuthService.java`
```java
package edu.kit.quak.application.user.services;

import edu.kit.quak.application.user.ports.in.AuthServicePort;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService implements AuthServicePort {

    @Override
    public Map<String, Object> getAuthenticationStatus() {
        Map<String, Object> response = new HashMap<>();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.isAuthenticated() 
            && !"anonymousUser".equals(authentication.getPrincipal())) {
            
            response.put("authenticated", true);
            
            if (authentication.getPrincipal() instanceof OAuth2User user) {
                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("email", user.getAttribute("email"));
                userInfo.put("name", user.getAttribute("name"));
                userInfo.put("picture", user.getAttribute("picture"));
                response.put("user", userInfo);
            }
        } else {
            response.put("authenticated", false);
        }
        
        return response;
    }

    @Override
    public Map<String, Object> getAuthenticatedUserInfo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.getPrincipal() instanceof OAuth2User user) {
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("email", user.getAttribute("email"));
            userInfo.put("name", user.getAttribute("name"));
            userInfo.put("picture", user.getAttribute("picture"));
            userInfo.put("sub", user.getAttribute("sub"));
            return userInfo;
        }
        
        throw new RuntimeException("User not authenticated");
    }

    @Override
    public Map<String, String> logout(HttpSession session) {
        session.invalidate();
        SecurityContextHolder.clearContext();
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Logged out successfully");
        return response;
    }
}
```

### 1.3 Create Infrastructure Layer (Web & Persistence Adapters)

**Location**: `backend/src/main/java/edu/kit/quak/infrastructure/user/`

#### File: `in/web/rest/UserRestAdapter.java`
```java
package edu.kit.quak.infrastructure.user.in.web.rest;

import edu.kit.quak.application.user.ports.in.UserServicePort;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.user.in.web.rest.dto.UserResponse;
import edu.kit.quak.infrastructure.user.in.web.rest.mapper.UserDtoMapper;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class UserRestAdapter {

    private final UserServicePort userService;
    private final UserDtoMapper userDtoMapper;

    public UserRestAdapter(UserServicePort userService, UserDtoMapper userDtoMapper) {
        this.userService = userService;
        this.userDtoMapper = userDtoMapper;
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public UserResponse getCurrentUser(Authentication authentication) {
        User user = userService.getAuthenticatedUser(authentication);
        return userDtoMapper.toResponse(user);
    }
}
```

#### File: `in/web/rest/AuthRestAdapter.java`
```java
package edu.kit.quak.infrastructure.user.in.web.rest;

import edu.kit.quak.application.user.ports.in.AuthServicePort;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthRestAdapter {

    private final AuthServicePort authService;

    public AuthRestAdapter(AuthServicePort authService) {
        this.authService = authService;
    }

    @GetMapping("/status")
    public Map<String, Object> getAuthStatus(HttpSession session) {
        return authService.getAuthenticationStatus();
    }

    @GetMapping("/user")
    public Map<String, Object> getUser() {
        return authService.getAuthenticatedUserInfo();
    }

    @PostMapping("/logout")
    public Map<String, String> logout(HttpSession session) {
        return authService.logout(session);
    }
}
```

#### File: `in/web/rest/dto/UserResponse.java`
```java
package edu.kit.quak.infrastructure.user.in.web.rest.dto;

import java.util.UUID;

public record UserResponse(
    UUID userId,
    String email,
    String name,
    String avatarUrl,
    Boolean emailVerified
) {}
```

#### File: `in/web/rest/mapper/UserDtoMapper.java`
```java
package edu.kit.quak.infrastructure.user.in.web.rest.mapper;

import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.user.in.web.rest.dto.UserResponse;
import org.springframework.stereotype.Component;

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
```

#### File: `out/db/jpa/entity/JpaUser.java`
```java
package edu.kit.quak.infrastructure.user.out.db.jpa.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"issuer", "sub"})
})
public class JpaUser {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String issuer;

    @Column(nullable = false)
    private String sub;

    private String email;

    @Column(name = "email_verified")
    private Boolean emailVerified;

    private String name;

    @Column(name = "given_name")
    private String givenName;

    @Column(name = "family_name")
    private String familyName;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, columnDefinition = "TIMESTAMP(6)")
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", columnDefinition = "TIMESTAMP(6)")
    private Instant updatedAt;

    @Column(name = "last_login_at", columnDefinition = "TIMESTAMP(6)")
    private Instant lastLoginAt;

    // Getters and Setters
    // (Copy from feature/32's User.java)
}
```

#### File: `out/db/jpa/mapper/UserJpaMapper.java`
```java
package edu.kit.quak.infrastructure.user.out.db.jpa.mapper;

import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.user.out.db.jpa.entity.JpaUser;
import org.springframework.stereotype.Component;

@Component
public class UserJpaMapper {

    public User toDomain(JpaUser jpaUser) {
        if (jpaUser == null) return null;
        
        User user = new User();
        user.setId(jpaUser.getId());
        user.setIssuer(jpaUser.getIssuer());
        user.setSub(jpaUser.getSub());
        user.setEmail(jpaUser.getEmail());
        user.setEmailVerified(jpaUser.getEmailVerified());
        user.setName(jpaUser.getName());
        user.setGivenName(jpaUser.getGivenName());
        user.setFamilyName(jpaUser.getFamilyName());
        user.setAvatarUrl(jpaUser.getAvatarUrl());
        user.setCreatedAt(jpaUser.getCreatedAt());
        user.setUpdatedAt(jpaUser.getUpdatedAt());
        user.setLastLoginAt(jpaUser.getLastLoginAt());
        return user;
    }

    public JpaUser toJpa(User user) {
        if (user == null) return null;
        
        JpaUser jpaUser = new JpaUser();
        jpaUser.setId(user.getId());
        jpaUser.setIssuer(user.getIssuer());
        jpaUser.setSub(user.getSub());
        jpaUser.setEmail(user.getEmail());
        jpaUser.setEmailVerified(user.getEmailVerified());
        jpaUser.setName(user.getName());
        jpaUser.setGivenName(user.getGivenName());
        jpaUser.setFamilyName(user.getFamilyName());
        jpaUser.setAvatarUrl(user.getAvatarUrl());
        jpaUser.setCreatedAt(user.getCreatedAt());
        jpaUser.setUpdatedAt(user.getUpdatedAt());
        jpaUser.setLastLoginAt(user.getLastLoginAt());
        return jpaUser;
    }
}
```

#### File: `out/db/jpa/repository/SpringDataUserRepository.java`
```java
package edu.kit.quak.infrastructure.user.out.db.jpa.repository;

import edu.kit.quak.infrastructure.user.out.db.jpa.entity.JpaUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SpringDataUserRepository extends JpaRepository<JpaUser, UUID> {
    Optional<JpaUser> findByIssuerAndSub(String issuer, String sub);
}
```

#### File: `out/db/jpa/UserJpaAdapter.java`
```java
package edu.kit.quak.infrastructure.user.out.db.jpa;

import edu.kit.quak.application.user.ports.out.UserRepositoryPort;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.user.out.db.jpa.entity.JpaUser;
import edu.kit.quak.infrastructure.user.out.db.jpa.mapper.UserJpaMapper;
import edu.kit.quak.infrastructure.user.out.db.jpa.repository.SpringDataUserRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
public class UserJpaAdapter implements UserRepositoryPort {

    private final SpringDataUserRepository repository;
    private final UserJpaMapper mapper;

    public UserJpaAdapter(SpringDataUserRepository repository, UserJpaMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public User save(User user) {
        JpaUser jpaUser = mapper.toJpa(user);
        JpaUser saved = repository.save(jpaUser);
        return mapper.toDomain(saved);
    }

    @Override
    public Optional<User> findById(UUID id) {
        return repository.findById(id).map(mapper::toDomain);
    }

    @Override
    public Optional<User> findByIssuerAndSub(String issuer, String sub) {
        return repository.findByIssuerAndSub(issuer, sub).map(mapper::toDomain);
    }

    @Override
    public void deleteById(UUID id) {
        repository.deleteById(id);
    }
}
```

---

## Phase 2: Configuration & Infrastructure Changes

### 2.1 Update `application.properties`

**Merge the MariaDB configuration from feature/32:**

```properties
# Add to existing application.properties
spring.datasource.driver-class-name=org.mariadb.jdbc.Driver
spring.datasource.url=${DB_URL:jdbc:mariadb://localhost:3306/quak}
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:password}
spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MariaDBDialect

# Session Configuration (extended)
server.servlet.session.timeout=30d
server.servlet.session.cookie.max-age=30d
```

### 2.2 Update `docker-compose.dev.yaml`

**Cherry-pick the MariaDB port exposure:**
```bash
git show feature/32-feature-user-persistence-store-oidc-profile-with-mariadb:docker-compose.dev.yaml > /tmp/docker-compose-32.yaml
# Manually add: ports: - "3306:3306" to the db service
```

### 2.3 Update `build.gradle`

**Copy the testing infrastructure additions from feature/32:**
```bash
git diff feature/57-feature-backend-architektur-refactoring-ports-adapters...feature/32-feature-user-persistence-store-oidc-profile-with-mariadb -- backend/build.gradle
# Review and apply test-related changes
```

---

## Phase 3: Security Integration

### 3.1 Update `SecurityConfig.java`

**Modifications needed:**

```java
// Add to SecurityConfig.java

@EnableMethodSecurity  // Add this annotation to the class

// Modify authenticationSuccessHandler bean
@Bean
public AuthenticationSuccessHandler authenticationSuccessHandler(
        OidcSyncServicePort oidcUserSyncService) {
    SimpleUrlAuthenticationSuccessHandler delegate = new SimpleUrlAuthenticationSuccessHandler();
    delegate.setDefaultTargetUrl(frontendUrl + "/");
    delegate.setAlwaysUseDefaultTargetUrl(true);

    return (request, response, authentication) -> {
        if (authentication.getPrincipal() instanceof OidcUser oidcUser) {
            if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
                String registrationId = oauthToken.getAuthorizedClientRegistrationId();
                User user = oidcUserSyncService.syncUser(registrationId, oidcUser);
                request.getSession().setAttribute("userId", user.getId());
            }
        }
        delegate.onAuthenticationSuccess(request, response, authentication);
    };
}

// Add access denied handler in securityFilterChain
.exceptionHandling(exception -> exception
    .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
    .accessDeniedHandler((request, response, accessDeniedException) -> {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"Access Denied\",\"message\":\"" 
            + accessDeniedException.getMessage() + "\"}");
    })
)

// Add prompt=select_account to PKCE customizer
.additionalParameters(params -> {
    params.put("code_challenge", codeChallenge);
    params.put("code_challenge_method", "S256");
    params.put("prompt", "select_account");  // Add this line
})
```

### 3.2 Delete Old Security Controller

The base branch has `security/AuthController.java` which should be deleted since we'll use the new `AuthRestAdapter`:

```bash
rm backend/src/main/java/edu/kit/quak/security/AuthController.java
rm backend/src/main/java/edu/kit/quak/security/model/UserInfo.java
```

---

## Phase 4: Frontend Changes

### 4.1 Profile Page

**Cherry-pick the Profile.tsx changes:**
```bash
git show feature/32-feature-user-persistence-store-oidc-profile-with-mariadb:frontend/src/pages/Profile.tsx > frontend/src/pages/Profile.tsx
```

### 4.2 Testing Infrastructure

**Copy the test setup files:**
```bash
mkdir -p frontend/src/test
git show feature/32-feature-user-persistence-store-oidc-profile-with-mariadb:frontend/src/test/setup.ts > frontend/src/test/setup.ts
git show feature/32-feature-user-persistence-store-oidc-profile-with-mariadb:frontend/src/test/sample.test.tsx > frontend/src/test/sample.test.tsx
git show feature/32-feature-user-persistence-store-oidc-profile-with-mariadb:frontend/vite.config.ts > frontend/vite.config.ts
git show feature/32-feature-user-persistence-store-oidc-profile-with-mariadb:frontend/vitest.config.ts > frontend/vitest.config.ts
```

### 4.3 Update `package.json`

**Merge the test dependencies from feature/32:**
```bash
git diff feature/57-feature-backend-architektur-refactoring-ports-adapters...feature/32-feature-user-persistence-store-oidc-profile-with-mariadb -- frontend/package.json
# Add vitest, @testing-library/react, etc. to devDependencies
```

---

## Phase 5: Testing

### 5.1 Create Unit Tests for User Domain

**Location**: `backend/src/test/java/edu/kit/quak/`

#### File: `application/user/services/UserServiceTest.java`
```java
package edu.kit.quak.application.user.services;

import edu.kit.quak.application.user.ports.out.UserRepositoryPort;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.shared.tags.UnitTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@UnitTest
class UserServiceTest {

    @Mock
    private UserRepositoryPort userRepository;

    @InjectMocks
    private UserService userService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void findById_existingUser_returnsUser() {
        UUID userId = UUID.randomUUID();
        User user = new User(userId, "google", "123");
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        Optional<User> result = userService.findById(userId);

        assertTrue(result.isPresent());
        assertEquals(userId, result.get().getId());
    }

    // Add more tests...
}
```

#### File: `infrastructure/user/out/db/jpa/UserJpaAdapterTest.java`
```java
// Similar pattern to existing JPA adapter tests in filesystem domain
```

### 5.2 Create Integration Tests

**Location**: `backend/src/test/java/edu/kit/quak/integration/user/`

```java
package edu.kit.quak.integration.user;

import edu.kit.quak.shared.tags.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@IntegrationTest
class UserIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void getMeEndpoint_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/me"))
            .andExpect(status().isUnauthorized());
    }
}
```

### 5.3 Update Test Properties

**File**: `backend/src/test/resources/application.properties`
```properties
# Add H2 for tests
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.url=jdbc:h2:mem:testdb
spring.jpa.hibernate.ddl-auto=create-drop
```

---

## Phase 6: Cleanup

### 6.1 Remove Duplicate/Old Files

```bash
# Remove old security files that are replaced
rm -f backend/src/main/java/edu/kit/quak/security/AuthController.java
rm -f backend/src/main/java/edu/kit/quak/security/model/UserInfo.java
rm -f backend/src/main/java/edu/kit/quak/security/repository/UserRepository.java

# Remove any duplicates from feature/32 that don't fit the new architecture
rm -rf backend/src/main/java/edu/kit/quak/files/  # Already deleted in feature/57
```

### 6.2 Verify Compilation

```bash
cd backend
./gradlew clean build -x test
```

### 6.3 Run All Tests

```bash
./gradlew test
```

### 6.4 Commit Changes

```bash
git add .
git commit -m "feat: Integrate user persistence with hexagonal architecture

- Add User domain model (POJO) in core/user/model
- Add UserServicePort, OidcSyncServicePort, AuthServicePort in application/user/ports/in
- Add UserRepositoryPort in application/user/ports/out
- Add UserService, OidcUserSyncService, AuthService in application/user/services
- Add UserRestAdapter, AuthRestAdapter in infrastructure/user/in/web/rest
- Add JpaUser entity, UserJpaMapper, UserJpaAdapter in infrastructure/user/out/db/jpa
- Update SecurityConfig for OIDC sync integration
- Update application.properties for MariaDB
- Update frontend Profile page to use new /api/me endpoint
- Add frontend testing infrastructure (vitest)

Closes #32"
```

---

## Files Reference

### New Files to Create (Backend)

| Layer | Package Path | Files |
|-------|--------------|-------|
| **Core** | `core/user/model/` | `User.java` |
| **Application (Ports In)** | `application/user/ports/in/` | `UserServicePort.java`, `OidcSyncServicePort.java`, `AuthServicePort.java` |
| **Application (Ports Out)** | `application/user/ports/out/` | `UserRepositoryPort.java` |
| **Application (Services)** | `application/user/services/` | `UserService.java`, `OidcUserSyncService.java`, `AuthService.java` |
| **Infrastructure (Web)** | `infrastructure/user/in/web/rest/` | `UserRestAdapter.java`, `AuthRestAdapter.java` |
| **Infrastructure (DTOs)** | `infrastructure/user/in/web/rest/dto/` | `UserResponse.java` |
| **Infrastructure (Mappers)** | `infrastructure/user/in/web/rest/mapper/` | `UserDtoMapper.java` |
| **Infrastructure (JPA Entity)** | `infrastructure/user/out/db/jpa/entity/` | `JpaUser.java` |
| **Infrastructure (JPA Mapper)** | `infrastructure/user/out/db/jpa/mapper/` | `UserJpaMapper.java` |
| **Infrastructure (JPA Repo)** | `infrastructure/user/out/db/jpa/repository/` | `SpringDataUserRepository.java` |
| **Infrastructure (JPA Adapter)** | `infrastructure/user/out/db/jpa/` | `UserJpaAdapter.java` |

### Files to Modify

| File | Changes |
|------|---------|
| `SecurityConfig.java` | Add `@EnableMethodSecurity`, update success handler, add access denied handler |
| `application.properties` | Add MariaDB config, session timeout |
| `docker-compose.dev.yaml` | Expose MariaDB port |
| `frontend/src/pages/Profile.tsx` | Use real API data |
| `frontend/package.json` | Add test dependencies |

### Files to Delete

| File | Reason |
|------|--------|
| `security/AuthController.java` | Replaced by `AuthRestAdapter` |
| `security/model/UserInfo.java` | Replaced by `UserResponse` DTO |
| `security/repository/UserRepository.java` | Replaced by `SpringDataUserRepository` + `UserJpaAdapter` |

---

## Quick Reference: Directory Structure After Merge

```
backend/src/main/java/edu/kit/quak/
├── QuaKApplication.java
├── application/
│   ├── filesystem/          # Existing
│   │   ├── ports/
│   │   └── services/
│   ├── library/             # Existing
│   │   ├── ports/
│   │   └── services/
│   └── user/                # NEW
│       ├── ports/
│       │   ├── in/
│       │   │   ├── AuthServicePort.java
│       │   │   ├── OidcSyncServicePort.java
│       │   │   └── UserServicePort.java
│       │   └── out/
│       │       └── UserRepositoryPort.java
│       └── services/
│           ├── AuthService.java
│           ├── OidcUserSyncService.java
│           └── UserService.java
├── core/
│   ├── filesystem/          # Existing
│   │   └── model/
│   ├── library/             # Existing
│   │   └── model/
│   └── user/                # NEW
│       └── model/
│           └── User.java
├── infrastructure/
│   ├── GlobalExceptionHandler.java
│   ├── filesystem/          # Existing
│   │   ├── in/web/rest/
│   │   └── out/db/jpa/
│   ├── library/             # Existing
│   │   ├── in/web/rest/
│   │   └── out/json/
│   └── user/                # NEW
│       ├── in/web/rest/
│       │   ├── AuthRestAdapter.java
│       │   ├── UserRestAdapter.java
│       │   ├── dto/
│       │   │   └── UserResponse.java
│       │   └── mapper/
│       │       └── UserDtoMapper.java
│       └── out/db/jpa/
│           ├── UserJpaAdapter.java
│           ├── entity/
│           │   └── JpaUser.java
│           ├── mapper/
│           │   └── UserJpaMapper.java
│           └── repository/
│               └── SpringDataUserRepository.java
└── security/
    └── SecurityConfig.java  # Modified
```

---

## Estimated Time

| Phase | Estimated Time |
|-------|---------------|
| Phase 1: Create User Domain | 2-3 hours |
| Phase 2: Configuration | 30 minutes |
| Phase 3: Security Integration | 1 hour |
| Phase 4: Frontend Changes | 30 minutes |
| Phase 5: Testing | 1-2 hours |
| Phase 6: Cleanup | 30 minutes |
| **Total** | **5-7 hours** |

---

## Rollback Plan

If something goes wrong:

```bash
# Return to original base branch
git checkout feature/57-feature-backend-architektur-refactoring-ports-adapters

# Or reset to backup
git checkout feature/merge-user-persistence-backup