# Contributing to Nivesh

Thank you for considering contributing to Nivesh! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Security & Pre-commit Hooks](#security--pre-commit-hooks)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

---

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

---

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Screenshots** (if applicable)
- **Environment details** (OS, Node version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- Use a clear and descriptive title
- Provide detailed description of the proposed feature
- Explain why this enhancement would be useful
- List any additional context or screenshots

### Pull Requests

- Fill in the required template
- Follow the coding standards
- Include appropriate test cases
- Update documentation as needed

---

## Development Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL 15+
- Neo4j 5+

### Setup Steps

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/Nivesh.git
cd Nivesh

# Install backend dependencies
cd backend
npm install

# Install ML services dependencies
cd ../ml-services
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configurations

# Start services with Docker
docker-compose up -d

# Run database migrations
npm run migrate
```

---

## Security & Pre-commit Hooks

This project uses **pre-commit hooks** to prevent secrets and credentials from being accidentally committed.

### Setup

```bash
# Install pre-commit (Python required)
pip install pre-commit

# Install the hooks into your local clone
pre-commit install

# (Optional) Run against all files to verify
pre-commit run --all-files
```

### What the hooks check

| Hook | Purpose |
|------|---------|
| `detect-secrets` | Scans staged files for API keys, passwords, tokens |
| `detect-private-key` | Blocks commits containing private key material |
| `check-added-large-files` | Prevents files > 500 KB from being committed |
| `check-merge-conflict` | Catches leftover merge-conflict markers |
| `no-commit-to-branch` | Blocks direct commits to `main` |

### Environment variables

Never hard-code secrets — use environment variables instead:

```bash
# Copy the template and fill in real values
cp .env.example .env                         # backend
cp docker-compose.env.example .env           # Docker Compose
```

See [docs/SECURITY.md](docs/SECURITY.md) for the full secrets-management guide, including Kubernetes sealed-secrets, rotation schedules and incident-response procedures.

---

## Coding Standards

### TypeScript/JavaScript (NestJS Backend)

- Use **TypeScript** strict mode
- Follow **Airbnb Style Guide**
- Use **ESLint** and **Prettier**
- Write **unit tests** with Jest
- Aim for **80%+ code coverage**

```typescript
// Good
export class UserService {
  async findUser(id: string): Promise<User> {
    return await this.userRepository.findOne({ where: { id } });
  }
}

// Bad
export class UserService {
  findUser(id) {
    return this.userRepository.findOne({ where: { id } });
  }
}
```

### Python (AI Engine)

- Follow **PEP 8** style guide
- Use **type hints**
- Write **docstrings** for all functions
- Use **pytest** for testing
- Use **Black** for formatting

```python
# Good
def calculate_risk_score(user_data: dict) -> float:
    """
    Calculate risk score for a user based on financial data.

    Args:
        user_data: Dictionary containing user financial information

    Returns:
        Risk score between 0 and 1
    """
    return risk_model.predict(user_data)[0]

# Bad
def calc_risk(data):
    return risk_model.predict(data)[0]
```

### Database

- Use **migrations** for schema changes
- Add **indexes** for frequently queried columns
- Write **efficient queries**
- Document complex queries

---

## Commit Guidelines

We follow **Conventional Commits** specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only
- **style**: Code style changes (formatting)
- **refactor**: Code refactoring
- **test**: Adding tests
- **chore**: Maintenance tasks

### Examples

```bash
feat(auth): add keycloak integration

Implemented Keycloak authentication for user login.
Added JWT validation middleware.

Closes #123

---

fix(ai): resolve hallucination in expense prediction

Fixed issue where AI was generating incorrect expense forecasts
due to improper data normalization.

Fixes #456
```

---

## Pull Request Process

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**

   - Write code
   - Add tests
   - Update documentation

3. **Lint and test**

   ```bash
   npm run lint
   npm run test
   ```

4. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push to your fork**

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Fill in the PR template
   - Wait for review

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] No merge conflicts

---

## Testing

### Unit Tests

```bash
# Backend
cd backend
npm run test

# ML Services
cd ml-services
pytest
```

### Integration Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:cov
```

---

## Documentation

When adding new features, update:

- **README.md** - If it affects setup or usage
- **API documentation** - For new endpoints
- **Architecture docs** - For structural changes
- **Code comments** - For complex logic

---

## Questions?

Feel free to:

- Open an issue for questions
- Join our Discord community
- Email: dev@nivesh.ai

---

**Thank you for contributing to Nivesh!** 🎉
