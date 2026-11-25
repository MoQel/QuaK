# Development workflow
As development workflow we use use [Git Flow](https://www.atlassian.com/de/git/tutorials/comparing-workflows/gitflow-workflow).

## Issues
Please use the defined issue templates and add relevant tags.  
If you are working on an issue, please assign yourself to it.

## Branching
We use default naming conventions, e.g.,
- feature branches use the prefix `feature/`.
- bugfix branches use the prefix `bugfix/`.

## Commit messages
You can add #[issue number] in your commit message to make it reference the issue (optional).

## Pull requests
Please use the defined pull requests template.  
Please review the pull request by yourself before assigning another reviewer.  
After merge into development head branches are deleted automatically.

## Projects
We use projects to organize issues that should be addressed within a certain timeframe.

## Linting
⚠️**TBD**

## Code analysis
[SonarQube Cloud](https://sonarcloud.io/project/overview?id=moqel_QuaK) analyzes the whole repository as one project on every pull request and every push to `development` and `main` (`.github/workflows/sonar.yml`).
The scan is configured in [sonar-project.properties](../sonar-project.properties) and needs the `SONAR_TOKEN` secret. Automatic analysis must stay disabled in the project, otherwise the CI scan fails.

The workflow collects test coverage before the scan:
- Backend: `./gradlew test jacocoTestReport sonarLibraries` writes the JaCoCo XML report and copies the compile classpaths to `backend/build/sonar-libs` for the Java analysis.
- Frontend, packages and extension: `npm run test:coverage` runs all Vitest suites from the root and writes `coverage/lcov.info`.

Generated parsers are excluded from the analysis and the coverage reports.

## Third-party licenses
Every pull request runs the [OSS Review Toolkit](https://oss-review-toolkit.org/) (`.github/workflows/licenses.yml`) over the Gradle, npm, pip and Go dependencies that QuaK ships.
The check fails for a dependency whose license is not compatible with MIT according to the [OSADL matrix](https://www.osadl.org/html/CompatMatrix.html), whose license the matrix does not rate, or that declares no license.
A dependency under a choice of licenses passes if one choice is compatible.

- A dependency without license metadata gets a [curation](https://oss-review-toolkit.org/ort/docs/configuration/package-curations) in `.ort/config/curations.yml`, with the source of the license.
- A dependency that is not compatible is decided and recorded as a [resolution](https://oss-review-toolkit.org/ort/docs/configuration/resolutions) in `.ort.yml`. Unmodified Java and Python libraries under a weak copyleft license (LGPL, EPL, MPL) are resolved there already.
- npm build tools belong in `devDependencies`, everything the web app ships in `dependencies`.

The check only runs when a dependency or its configuration changes. It also fails when [THIRD-PARTY-LICENSES.md](../THIRD-PARTY-LICENSES.md) does not match the dependencies; replace the file with the one from the `ort-results` artifact of the run and commit it with the pull request. The artifact also contains the HTML report and the CycloneDX SBOM.
