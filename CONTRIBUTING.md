# Contributing to Zeaker

Thank you for your interest in contributing to Zeaker! Your help is welcome and appreciated. Please follow these guidelines to ensure a smooth process for everyone.

---

## How to Contribute

- **Bug Reports:**

  - Search [issues](https://github.com/playwora/zeaker/issues) to see if your bug is already reported.
  - If not, open a new issue with clear steps to reproduce, expected vs. actual behavior, and environment details.

- **Feature Requests:**

  - Open an issue describing your idea and its use case. Please explain why it would benefit Zeaker users.

- **Pull Requests:**
  1. Fork the repository and create a new branch for your change.
  2. Write clear, maintainable code following the standards below.
  3. Add or update tests as needed.
  4. Run all tests and ensure they pass.
  5. Submit a pull request with a clear description of your changes and the problem they solve.

---

## Coding Standards

- Use **ECMAScript 2020+** features (arrow functions, async/await, destructuring, etc.)
- Use `const` and `let` (not `var`)
- Prefer ES modules (`import`/`export`)
- No jQuery or legacy browser support
- Use modern Node.js APIs
- Follow the existing code style (indentation, spacing, naming)
- Include JSDoc comments for all exported functions/classes
- Add meaningful inline comments for complex logic

---

## Commit Messages

- Use clear, descriptive commit messages
- Reference issues when relevant (e.g., `Fixes #123`)
- Use [Conventional Commits](https://www.conventionalcommits.org/) if possible

---

## Running Tests

- Install dependencies: `npm install`
- Run tests: `npm test`
- Add new tests for new features or bug fixes

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). Please be respectful and inclusive in all interactions.

---

Thank you for helping make Zeaker better!
