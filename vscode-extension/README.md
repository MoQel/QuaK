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

1. Open a `.qasm` file.
2. Run **Reopen Editor With...** or **Open With...**.
3. Select **QuaK Circuit Editor**.
