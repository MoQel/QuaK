# QuaK

QuaK adds a visual circuit editor for OpenQASM files in VS Code.

Open a `.qasm` file and click the circuit icon in the editor title bar to get the
circuit next to the text. The `.qasm` file stays the source of truth, so existing
editor workflows such as saving, undo, source control and side-by-side text editing
continue to work through VS Code.

## Features

- Custom visual editor for `.qasm` files.
- Text editor remains the default; the circuit view is opened explicitly, and opens
  beside the text rather than replacing it.
- Multiple circuit editor panels can be opened for the same document.
- Circuit editor webview follows the active VS Code light or dark theme.
- Syntax highlighting, comment toggling and bracket matching for `.qasm` files.

## Current Preview State

QuaK currently supports a strict, lossless OpenQASM subset. Files that can be
round-tripped safely are editable through the circuit view. Files with syntax
errors, unsupported constructs or comments that would be lost are shown
read-only with an explanation.

## Language Support

QuaK registers `.qasm` as the `openqasm` language and brings syntax highlighting,
comment toggling and bracket matching with it. It also reports what the circuit
editor cannot write back, so a file explains itself in the Problems panel without
the circuit view being open.

## Usage

Open a `.qasm` file, then use any of:

- the circuit icon in the editor title bar — hold `Alt` to open in place instead of
  beside the text,
- <kbd>Ctrl</kbd>+<kbd>K</kbd> <kbd>Q</kbd> (<kbd>Cmd</kbd>+<kbd>K</kbd> <kbd>Q</kbd>
  on macOS),
- **QuaK: Open Circuit Editor to the Side** from the command palette,
- right-click the file in the Explorer,
- **Open With... > QuaK Circuit Editor**.

From the circuit editor, the file icon in the title bar goes back to the text, or
**QuaK: Show Source** from the command palette.

## Settings

| Setting | Default | Meaning |
|---|---|---|
| `quak.diagnostics.enable` | `true` | Report constructs the circuit editor cannot write back in the Problems panel |
