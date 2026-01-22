# 🧠 Quantum IDE Web Editor

This project is a web-based Quantum IDE designed to support intuitive quantum programming. It integrates:

    QLP Text Editor – for writing code in a quantum programming language.

    Qubit Circuit Builder – a graphical interface to build quantum circuits.

    Other views like the mathematical representation and the quanten possibilities

    Multidirectional Sync – any change in the code updates the circuit, etc.

The goal is to bridge textual and visual quantum programming, making development easier for both beginners and experts.

## Development

For linting use this command.
`npm run lint`

For manual code formatting of staged files with prettier use this command.
`npx lint-staged`

## Testing

Our project uses **Vitest** together with **React Testing Library** to ensure both the correctness of our quantum simulation logic and the stability of the user interface. Our testing strategy is divided into two main categories: **unit tests** for logic and engine validation, and **component tests** for UI and interaction validation.

---

### Tools & Frameworks
- **[Vitest](https://vitest.dev)** – Fast, TypeScript-friendly test runner
- **[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)** – Simulates user interaction and DOM testing
- **[JSDOM](https://github.com/jsdom/jsdom)** – Provides a virtual DOM for headless tests

Additional helpers include mocking utilities (`vi.mock`) and polyfills like `ResizeObserver` to support chart rendering in the test environment.

---

### Running Tests

To execute the test suite, use the following commands:

- **Run all tests once:**
  ```bash
  npm run test
  
- **Run tests in watch mode (interactive)**
  ```bash
  npx vitest
  
- Coverage
  ```bash
  npx vitest run --coverage
  
---
  
### Testing Strategy
#### Unit Tests (Logic & Engine)
Testing isolated **business logic** without any dependency on the UI

#### Component Tests
Component tests **simulate user interaction** and **validate how the UI reacts** to different states of the simulation.
- **Scope**: Views and React components (e.g., src/views/results-view.test.tsx)
- **Method**: We use Mocking (via vi.mock) to decouple UI

---

### Writing new Tests
- **File Naming**: Place test files next to the source code with the extension .test.ts (for logic) or .test.tsx (for components).

- **Setup**: The environment is configured in src/test/setup.ts to provide necessary polyfills (like ResizeObserver for charts) and testing-library extensions.

---