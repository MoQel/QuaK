---
description: Comprehensive Back-end Code Review Agent Workflow
---

This workflow guides you through a thorough code review for the back-end (Spring Boot) following the project's Hexagonal Architecture and coding standards.

// turbo
1. **Apply Formatting & Check Compilation**:
   - Run `./gradlew spotlessApply` in the `backend` directory to ensure consistent styling.
   - Run `./gradlew compileJava` to catch any immediate syntax or type errors.

2. **Verify Hexagonal Architecture Compliance**:
   - **Core Layer** (`edu.kit.quak.core.*`):
     - Ensure it contains ONLY domain models and pure business logic.
     - CRITICAL: No dependencies on Spring, JPA, or web frameworks.
   - **Application Layer** (`edu.kit.quak.application.*`):
     - Check `ports.in` (Use Case interfaces) and `ports.out` (Infrastructure interfaces).
     - Ensure `services` depend only on `core` models and `ports.out`.
     - Verify services are annotated with `@Service`.
   - **Infrastructure Layer** (`edu.kit.quak.infrastructure.*`):
     - `in`: REST adapters should only call `application` ports.
     - `out`: Persistence/API adapters must implement `application` ports.
     - Mappers: Must exist to decouple Domain models from DTOs/Entities.

3. **Check Naming & Best Practices**:
   - Interfaces: `*ServicePort` (In-Port), `*RepositoryPort` (Out-Port).
   - Logging: Use `@Slf4j` for all services and adapters.
   - Documentation: Controllers must have `@Tag` and `@Operation` (Swagger).
   - Exception Handling: Ensure domain exceptions are caught in `GlobalExceptionHandler` and return RFC-7807 **Problem Details**.

4. **Review Security**:
   - Verify endpoints use appropriate authentication/authorization checks.
   - Check sensitive logic doesn't leak internal details via exceptions.

5. **Examine Testing**:
   - Unit Tests: Required for `services` (Mocking ports).
   - Integration Tests: Required for repository adapters and REST controllers.
   - Run `./gradlew test` and summarize results.

6. **Feedback Structure**:
   - **Strengths**: What was done well.
   - **Architecture Violations**: (Highest Priority) Any layer leakage.
   - **Code Quality**: Logic, naming, and readability improvements.
   - **Test Coverage**: Assessment of test presence and quality.
