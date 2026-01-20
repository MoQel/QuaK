# QuaK Backend

## Testing Workflows

### 1. Test-Kategorien

We distinguish between two main types of tests, marked by custom annotations. Additional annotations may be added.

#### Unit Tests (`@UnitTest`)
* **Goal:** Testing business logic in isolation.
* **Properties:** Very fast, no Spring Context, no database, no I/O (except mocked/in-memory).
* **Scope:**
  * **Domain Models:** Pure Java JUnit tests.
  * **Services:** Mocking repository ports (via Mockito).
  * **Mapping:** Testing mapping and logic (via Mockito).

#### Integration Tests (`@IntegrationTest`)
* **Goal:** Testing the wiring and configuration.
* **Features:** Slower, boots up the complete Spring Context (`@SpringBootTest`).
* **Scope:**
  * Checking whether `application.properties` are loaded correctly.
  * Checking dependency injection (are all beans found?).
  * Security configuration (e.g., `@WithMockUser`).
  * Smoke tests for critical paths (controller -> service -> repository).
  * Adapter (In/Web): Slice tests with `@WebMvcTest` (mocking the service ports).
  * Adapter (Out/Jpa): Tests for persistence adapters using an in-memory H2 database.
        
    
---

### 2. Gradle Commands

The `build.gradle` is configured so that tests can be run selectively:

| Command                     | Description                                                    |
|:----------------------------|:---------------------------------------------------------------|
| `./gradlew unitTest`        | Runs **only** fast unit tests. (Default for local development) |
| `./gradlew integrationTest` | Runs **only** slower integration tests.                        |
| `./gradlew check`           | Performs **all** tests (unit + integration) and checks.        |

---