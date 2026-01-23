🧠 Quantum IDE Web Editor

This project is a web-based Quantum IDE designed to support intuitive quantum programming. It integrates:

    QLP Text Editor – for writing code in a quantum programming language.

    Qubit Circuit Builder – a graphical interface to build quantum circuits.

    Other views like the mathematical representation and the quanten possibilities

    Multidirectional Sync – any change in the code updates the circuit, etc.

The goal is to bridge textual and visual quantum programming, making development easier for both beginners and experts.

## Development

### Linting
For linting use this command.
```bash
npm run lint
```

### Testing
This project uses [Vitest](https://vitest.dev/) for testing.

* **Run all tests:**
  ```bash
  npm test
  ```
* **Watch mode (automatic re-run on changes):**
  ```bash
  npm run test:watch
  ```
* **Interactive UI:**
  ```bash
  npm run test:ui
  ```
* **Coverage report:**
  ```bash
  npm run test:coverage
  ```
