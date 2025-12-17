# Backend Architecture: Ports & Adapters (Hexagonal Architecture)
This project is built using the Ports & Adapters architectural pattern (also known as Hexagonal Architecture). This approach aims to create a loosely coupled application core that is independent of frameworks, user interfaces, databases, and external systems.

<table>
  <tr>
    <td width="40%">
      <img src="assets/clean_architecture.png" alt="drawing"/>
    </td>
    <td width="60%">
      <p>
        The ports & adapters rely on Clean Architecture using the Dependency Inversion Principle. By isolating the business logic, high testability, maintainability, and the flexibility to swap out infrastructure components is ensured without affecting the core domain.
      </p>
    </td>
  </tr>
</table>

Hexagonal Architecture solves this by defining [`incoming & outgoing ports`](https://github.com/MoQel/QuaK/tree/development/backend/src/main/java/edu/kit/quak/application/filesystem/ports) via dependency injection.

[`Input ports`](https://github.com/MoQel/QuaK/tree/development/backend/src/main/java/edu/kit/quak/application/filesystem/ports/in) specify the interface through which the application can be accessed. 
Various adapters—such as [`web controllers`](https://github.com/MoQel/QuaK/tree/development/backend/src/main/java/edu/kit/quak/infrastructure/in/web/rest), messaging systems, or other external systems—use these input ports to invoke the use cases via dependency injection.

The [`use cases`](https://github.com/MoQel/QuaK/tree/development/backend/src/main/java/edu/kit/quak/application/filesystem/services) implement the input ports and encapsulate the **business rules**, operating on [`domain entities`](https://github.com/MoQel/QuaK/tree/development/backend/src/main/java/edu/kit/quak/core/filesystem/model) that represent the core domain model. 

[`Output ports`](https://github.com/MoQel/QuaK/tree/development/backend/src/main/java/edu/kit/quak/application/filesystem/ports/out) define how the system interacts with external resources, such as databases or external services.

[`Persistence Adapters`](https://github.com/MoQel/QuaK/tree/development/backend/src/main/java/edu/kit/quak/infrastructure/out/db/jpa) implement these [`output ports`](https://github.com/MoQel/QuaK/tree/development/backend/src/main/java/edu/kit/quak/application/filesystem/ports/out), allowing the infrastructure to be swapped or replaced without affecting the core business logic, ensuring high maintainability, testability, and flexibility.

<img src="assets/hexagonal_architecture.png" alt="drawing"/>
