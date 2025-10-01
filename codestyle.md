# Code Style Guidelines

When modifying existing code or adding new code, strictly adhere to these rules to maintain a minimal, modular, and maintainable codebase.

## Core Principles
- **Minimal**: Write the least code necessary. Avoid unnecessary abstractions or features.
- **Modular**: Organize code into small, reusable modules with clear boundaries.
- **Less Lines**: Prefer concise expressions. Break long lines, but don't add verbosity.
- **Least Dependencies**: Use built-in Node.js features first. Only add packages when absolutely required.
- **No Future Proofing**: Implement only what's needed now. Avoid speculative features.
- **Good Comments**: Use JSDoc for functions and concise comments for complex logic.
- **No Fallbacks**: Handle errors explicitly. Do not add catch-all try/catch or default behaviors that hide issues.
- **ES6 Standard**: Use modern JavaScript: `const`/`let`, arrow functions, async/await, destructuring, template literals.
- **Good Directory Structure**: Keep related files together (e.g., `src/` for core logic, `docs/` for documentation).
- **No Magic Numbers/Strings**: Extract constants for any hardcoded values (e.g., ports, limits).
- **No Hardcoded Values**: Use environment variables or config for paths, URLs, secrets.

## Additional Best Practices
- **Naming Conventions**:
  - `camelCase` for variables and functions (e.g., `processIdea`).
  - `PascalCase` for classes (e.g., `IdeaProcessor`).
  - `UPPER_SNAKE_CASE` for constants (e.g., `DEFAULT_PORT`).
- **Single Responsibility**: Each function or class must have exactly one reason to change.
- **DRY Principle**: Eliminate duplication by extracting shared logic into functions.
- **Input Validation**: Validate function inputs immediately (e.g., check types, ranges) and throw errors for invalid data.
- **Avoid Side Effects**: Prefer pure functions. Minimize mutations, file I/O, or external calls in core logic.

## Examples
- **Good**: `const result = await processIdea(validatedInput);`
- **Bad**: `if (input) { ... } else { return default; }` (no fallbacks)
- **Extract Constants**: `const MAX_IDEA_LENGTH = 1000;` instead of `if (idea.length > 1000)`

Follow these rules rigorously to ensure code is predictable, testable, and easy to maintain.
