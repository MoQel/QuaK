# QuaK

QuaK adds a visual circuit editor for OpenQASM files to VS Code.

Open a `.qasm` file and click the circuit icon in the editor title bar to see the
circuit next to the text. The file itself stays an ordinary text file, so saving,
undo, search, split view and source control keep working exactly as they always do.

## Features

- Build and change a circuit by dragging gates; the `.qasm` file updates as you go.
- Edit the text and the circuit side by side — both views stay in sync.
- Open the same file in more than one circuit view at a time.
- Hover a gate or a qubit register to see what it does.
- Syntax highlighting, comment toggling and bracket matching for `.qasm` files.
- Follows your VS Code colour theme, light or dark.

## Current Preview State

QuaK reads a subset of OpenQASM 3. A file that fits into that subset can be edited in
the circuit view; anything else opens read-only, with a note naming what stood in the
way. Editing the text is never restricted.

Nothing is rewritten behind your back. If saving the circuit would drop something —
a construct QuaK does not support, or one of your comments — it says so instead.

Measurement is not editable yet: a file containing one opens read-only.

## Language Support

QuaK claims `.qasm` files as OpenQASM and brings syntax highlighting, comment toggling
and bracket matching with it.

Hover a gate to see its name, what it does, how many qubits it acts on and — where it
is small enough to read — its matrix. Hover a qubit register to see how wide it is.

The Problems panel shows two things, each of which can be switched off on its own:
errors in your code, and what keeps a file read-only in the circuit view.

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

| Setting                        | Default | Meaning                                                                 |
| ------------------------------ | ------- | ----------------------------------------------------------------------- |
| `quak.diagnostics.errors`      | `true`  | Show diagnostics for errors in OpenQASM code                            |
| `quak.diagnostics.syncSupport` | `true`  | Show diagnostics for code that cannot be synced with the circuit editor |
| `quak.hover.enabled`           | `true`  | Show information about gates and qubit registers on hover               |
