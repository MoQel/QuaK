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

## Third-party licenses
Every pull request runs the [OSS Review Toolkit](https://oss-review-toolkit.org/) (`.github/workflows/licenses.yml`) over the Gradle, npm, pip and Go dependencies that QuaK ships.
The check fails for a dependency whose license is not compatible with MIT according to the [OSADL matrix](https://www.osadl.org/html/CompatMatrix.html), or that declares no license.

- A dependency without license metadata gets a curation in `.ort/config/curations.yml`, with the source of the license.
- A dependency that is not compatible is decided by a maintainer and recorded as a resolution in `.ort.yml`.

After a merge, the workflow regenerates [THIRD-PARTY-LICENSES.md](../THIRD-PARTY-LICENSES.md). The HTML report and the CycloneDX SBOM of each run are attached to the workflow run as artifacts.
