# QuaK

## Developing

Please have a look at the [developer guidelines](/docs/DEVELOPMENT.md).

## Execution
To run the QuaK editor, run 
`gradlew bootRun`
inside the `backend` directory

### Automatic installation of nodejs
Through the use of the [gradle-node-plugin], the project can automatically install `npm`.
If you want to use this feature, run any gradle-command with the flag `-PdownloadNode` (i.e. `gradlew :bootRun -PdownloadNode`).

If you wish to remove the custom nodejs install, run `gradlew :removeCustomNode`.

[gradle-node-plugin]: https://github.com/node-gradle/gradle-node-plugin