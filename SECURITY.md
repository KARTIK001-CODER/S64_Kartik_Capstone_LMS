# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it privately by emailing the project maintainer. Do not open a public issue.

We will acknowledge receipt within 48 hours and provide a timeline for a fix.

## What to Include

- Description of the vulnerability.
- Steps to reproduce.
- Affected versions.
- Any potential impact.

## Scope

- Authentication bypass.
- Data exposure (PII, tokens, credentials).
- Injection attacks (SQL, NoSQL, XSS, CSRF).
- Insecure direct object references (IDOR).

## Out of Scope

- Rate limiting bypass without demonstrated impact.
- Missing HTTP headers that do not lead to a concrete vulnerability.
- Self-XSS.
- Social engineering.
