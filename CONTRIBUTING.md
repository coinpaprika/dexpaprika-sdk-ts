# Contributing to DexPaprika SDK

Thank you for considering contributing to the DexPaprika JavaScript SDK! This document outlines the process for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and considerate of others.

## How to Contribute

### Reporting Bugs

If you find a bug in the SDK, please create an issue on our [GitHub repository](https://github.com/coinpaprika/dexpaprika-sdk-ts/issues) with the following information:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Any relevant code snippets, error messages, or screenshots
- SDK version and environment details (Node.js version, etc.)

### Suggesting Enhancements

We welcome suggestions for improvements! Please create an issue with:

- A clear, descriptive title
- A detailed description of the proposed enhancement
- Any relevant examples or use cases
- If applicable, potential implementation approaches

### Pull Requests

1. Fork the repository
2. Create a new branch for your feature or bug fix: `git checkout -b feature/your-feature-name` or `git checkout -b fix/your-bug-fix`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes with a descriptive commit message
6. Push to your fork: `git push origin feature/your-feature-name`
7. Submit a pull request to the `main` branch of the original repository

## Development Guidelines

### Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/dexpaprika-sdk-ts.git
cd dexpaprika-sdk-ts

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Code Style

- Follow the existing code style
- Use TypeScript types for all functions and variables
- Document public APIs with JSDoc comments
- Keep code clean, modular, and testable

### Testing

- Add tests for new features or bug fixes
- Ensure all existing tests pass before submitting a pull request
- Test your changes in different environments if possible

## Release Process

The Coinpaprika team maintains the release schedule. Generally, we follow semantic versioning:

- MAJOR version for incompatible API changes
- MINOR version for new functionality in a backward-compatible manner
- PATCH version for backward-compatible bug fixes

## License

By contributing to this project, you agree that your contributions will be licensed under the project's MIT License.

## Questions?

If you have any questions or need help, please reach out to us at [support@coinpaprika.com](mailto:support@coinpaprika.com).

Thank you for your contribution! 