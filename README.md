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

## Further Setup
### Using ANTLR-generated Lexer and Parser from `.g4` Files
* You need to bootRun the project at least once to generate the Lexer and Parser java classes.
* Then, mark backend/build/generated-src/antlr/main as Sources Root (and then sync gradle changes) to resolve occurring problems with integrating Lexer and Parser files.