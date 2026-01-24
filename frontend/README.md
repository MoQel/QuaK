# 🧠 Quantum IDE Web Editor

This project is a web-based Quantum IDE designed to support intuitive quantum programming. It integrates:

    QLP Text Editor – for writing code in a quantum programming language.

    Qubit Circuit Builder – a graphical interface to build quantum circuits.

    Other views like the mathematical representation and the quanten possibilities

    Multidirectional Sync – any change in the code updates the circuit, etc.

The goal is to bridge textual and visual quantum programming, making development easier for both beginners and experts.
---
## Development

### Linting
For linting use this command.
```bash
npm run lint
```

### To configure auto formatter using prettier and husky follow this steps:
1. in root Quak folder `npm install`
2. run `git config core.hooksPath .husky`
3. If the file has no rights run `chmod +x .husky/pre-commit`
---
## Testing
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
---

### Testing Strategy
#### Unit Tests (Logic & Engine)
Testing isolated **business logic** without any dependency on the UI

#### Component Tests
Component tests **simulate user interaction** and **validate how the UI reacts** to different states of the simulation.

---

### Writing new Tests
- **File Naming**: Place test files next to the source code with the extension .test.ts (for logic) or .test.tsx (for components).

- **Setup**: The environment is configured in src/test/setup.ts to provide necessary polyfills (like ResizeObserver for charts) and testing-library extensions.

---