# QuaK

## Developing

Please have a look at the [developer guidelines](/docs/DEVELOPMENT.md).

## Execution
To run the QuaK editor, run 
`gradlew bootRun`
inside the `backend` directory

### Dependencies
The project requires the following dependencies to be installed on the system:
* Java >= Version 21

### Automatic installation of nodejs
Through the use of the [gradle-node-plugin], the project can automatically install `npm`.
If you want to use this feature, run any gradle-command with the flag `-PdownloadNode` (i.e. `gradlew :bootRun -PdownloadNode`).

If you wish to remove the custom nodejs install, run `gradlew :removeCustomNode`.

[gradle-node-plugin]: https://github.com/node-gradle/gradle-node-plugin

## Docker Workflows

### Development Workflow
For active development with hot-reloading:

1.  **Start Backend & Database:**
    ```bash
    sudo docker compose -f docker-compose.dev.yaml up --build
    ```
    *   Runs the Spring Boot backend on port `8080`.
    *   Runs MariaDB on port `3306`.
    *   *Note:* The backend does **not** serve frontend files in this mode.

2.  **Start Frontend:**
    In a new terminal:
    ```bash
    cd frontend
    npm run dev
    ```
    *   Runs the Vite dev server on port `5173`.
    *   Proxies API requests to `localhost:8080`.
    *   Access the app at `http://localhost:5173`.

### Production Workflow
To simulate the production environment (single deployment unit):

1.  **Build & Run Everything:**
    ```bash
    sudo docker compose -f docker-compose.prod.yaml up --build
    ```
    *   Builds the frontend and bundles it inside the backend JAR.
    *   Runs the backend on port `8080`.
    *   Access the app at `http://localhost:8080`.

## Deployment

The project will automatically be deployed when a change to the _development_-branch happens.

### Setting up the Deployment Server
On a server of your choice, set up the following:
* [Docker](https://docs.docker.com/engine/install/)
* [Dokku](https://dokku.com/docs/getting-started/installation/)
  * Make sure to enable `vhost` during the installation-dialog (this is the default)

Then, run the following commands:
```bash
dokku apps:create quak
dokku builder:set quak build-dir backend

# Set up an ssh-key
ssh-keygen -f github -N ""
cat github.pub | sudo sshcommand acl-add dokku runner@github
cat github
# Save the content of the private for later
# You may also want to move the ssh-keys somewhere else
```
We now want to set the GitHub-Secrets inside this repository:
* _DEPLOYMENT_SERVER_ADDRESS_
* _DEPLOYMENT_SERVER_SSH_KEY_
  * This has the content of the private-key generated above

Lastly, make sure that all relevant ports (e.g. 8080) are exposed to the outside world.