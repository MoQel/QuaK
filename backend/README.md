# QuaK Backend

## Code Formatting and Style

This project uses **Spotless** for code formatting and **Checkstyle** for style enforcement.

### Commands

| Command                              | Description                                    |
|:-------------------------------------|:-----------------------------------------------|
| `./gradlew spotlessApply`            | Auto-format all Java code                      |
| `./gradlew spotlessCheck`            | Check if code is properly formatted            |

### Before Creating a Pull Request

**Spotless formatting checks only run on pull requests** (not on regular pushes to your branch).

Before creating a PR, ensure your code is properly formatted:

```bash
cd backend
./gradlew spotlessApply
./gradlew spotlessCheck
```

If the PR pipeline fails due to formatting, run `./gradlew spotlessApply` locally, commit, and push again.

---

## API Documentation (OpenAPI)

The backend automatically provides an OpenAPI (Swagger) specification based on the Spring controllers.

### Keeping the spec current
The spec is committed at `docs/api/openapi.yaml`. The `OpenAPI / spec-up-to-date` check of the CI pipeline generates it again and fails if the committed file differs, so every change to the API has to come with an updated spec.

* **After changing endpoints, DTOs or `OpenApiConfig.java`:** regenerate the spec and commit it together with your change:
  ```bash
  cd backend
  ./gradlew generateOpenApiDocs
  ```
* **If the `OpenAPI / spec-up-to-date` check fails:** the job summary shows the difference. Run the command above and commit the result.
* **Merge conflicts in `docs/api/openapi.yaml`:** do not resolve them by hand. Resolve the conflicts in the code, run the command again, and commit the regenerated file.

### Configuration (`OpenApiConfig.java`)
The file `src/main/java/edu/kit/quak/infrastructure/config/OpenApiConfig.java` contains the global configuration for the API documentation.

**When do I need to edit this file?**
* **API Metadata:** Changing the API version, title, or main description.
* **Security:** Modifying authentication methods (e.g., updating dev mode credentials).
* **Tags:** When adding a new functional area to the API. Tags are used to group endpoints in the Swagger UI. If you create a new controller that doesn't fit into existing categories (Authentication, Projects, Files, etc.), you should add a new tag here.

---

## Testing Workflows

### 1. Test-Categories

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