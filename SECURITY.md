# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Arkenos, please report it responsibly. **Do not open a public GitHub issue.**

Email your findings to **[security@arkenos.ai](mailto:security@arkenos.ai)** with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge receipt within 48 hours and aim to provide a fix or mitigation within 7 days for critical issues.

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest `master` | Yes |
| Older releases | Best effort |

## Scope

The following are in scope:

- Backend API (FastAPI)
- Frontend application (Next.js)
- Agent runtime (Python/LiveKit)
- Docker Compose configuration
- Authentication and authorization flows

## Out of Scope

- Third-party services (Clerk, LiveKit Cloud, Twilio, etc.) — report directly to those vendors
- Social engineering attacks
- Denial of service attacks

## Disclosure

We follow coordinated disclosure. We will work with you on a timeline for public disclosure after a fix is available.
