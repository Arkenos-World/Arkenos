# Contributing to Arkenos

Thanks for your interest in contributing to Arkenos. This document covers the process for contributing to this project.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a branch from `master` for your work
4. Make your changes
5. Test your changes locally
6. Submit a pull request

## Branch Naming

Use the following conventions:

- `feat/short-description` — new features
- `fix/short-description` — bug fixes
- `chore/short-description` — maintenance, tooling, CI
- `docs/short-description` — documentation changes
- `refactor/short-description` — code restructuring

## Development Setup

```bash
# Clone
git clone https://github.com/Arkenos-World/Arkenos.git
cd Arkenos

# Backend
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -e .
cp .env.example .env
# Edit .env with your keys
uvicorn app.main:app --reload

# Frontend (separate terminal)
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your keys
npm run dev

# Agent (separate terminal)
cd agent
python -m venv venv
source venv/bin/activate
pip install -e .
# No .env needed — the agent fetches keys from the backend dashboard
python agent.py dev
```

## Pull Request Guidelines

- Keep PRs focused on a single change
- Include a clear description of what changed and why
- Reference any related issues
- Make sure existing tests pass
- Add tests for new functionality where applicable
- Do not commit `.env` files or secrets

## Reporting Issues

Use [GitHub Issues](https://github.com/Arkenos-World/Arkenos/issues) with the provided templates. Include enough detail to reproduce the problem — environment, steps, expected vs actual behavior, and relevant logs.

## Code Style

- **Python** (backend/agent): Follow PEP 8. Use type hints where practical.
- **TypeScript** (frontend): Follow the existing ESLint configuration.
- Keep functions focused and files reasonably sized.

## License

By contributing to Arkenos, you agree that your contributions will be licensed under the [AGPL-3.0 License](LICENSE).
