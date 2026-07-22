# QuaK

QuaK adds a visual circuit editor for OpenQASM files in VS Code.

Open a `.qasm` file with **Open With... > QuaK Circuit Editor** to view it in
the QuaK editor while keeping the normal text editor available. The `.qasm` file
stays the source of truth, so existing editor workflows such as saving, undo,
source control and side-by-side text editing continue to work through VS Code.

## Features

- Custom visual editor for `.qasm` files.
- Text editor remains the default; the circuit editor is opened explicitly via
  **Open With...**.
- Multiple circuit editor panels can be opened for the same document.
- Circuit editor webview follows the active VS Code light or dark theme.
- Ships as an extension pack with an OpenQASM language extension for syntax and
  language features.

## Current Preview State

QuaK currently renders the real QuaK circuit editor and gate library inside VS
Code, but the circuit shown in the editor is still a fixed demo circuit. The open
`.qasm` file is not parsed into the visual circuit yet, and visual circuit edits
are not written back to the file yet.

This means the extension is useful today for validating the VS Code integration,
theme behavior and editor workflow, but not yet as a complete visual OpenQASM
editing workflow.

## Language Support

QuaK contributes the circuit editor only. OpenQASM language features such as
syntax highlighting, formatting and diagnostics come from a separate OpenQASM
language extension.

QuaK includes
[`orangekame3.vscode-qasm`](https://marketplace.visualstudio.com/items?itemName=orangekame3.vscode-qasm)
as an extension pack entry. It is installed alongside QuaK, but it is managed
independently and can be uninstalled without affecting the circuit editor. If you
prefer another OpenQASM extension, you can keep using that instead.

## Usage

1. Open a `.qasm` file.
2. Run **Reopen Editor With...** or **Open With...**.
3. Select **QuaK Circuit Editor**.

## Development

From the repository root:

```bash
npm run build:extension
```

Or from this folder, rebuild on change:

```bash
npm run watch
```

Then press <kbd>F5</kbd> in VS Code and use the **Run QuaK Extension** launch
configuration to open an Extension Development Host.

Install extension local:

```bash
cd vscode-extension && npm run package  
```

Then go to extensions click install from vsix and install the created extension package.