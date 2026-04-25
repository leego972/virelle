# Security Policy

## Production security rules

- Do not commit provider tokens, API keys, private keys, session secrets, database URLs, webhook secrets, or OAuth credentials.
- Store secrets only in the deployment provider, local password manager, or approved secret manager.
- Rotate any credential that has ever appeared in git history or public logs.
- Production must fail startup when the session signing secret is missing.
- All admin routes must require authenticated admin context before performing any database mutation.
- Destructive maintenance routes must be disabled in production unless an explicit emergency flag is enabled.
- Use parameterized queries or the ORM query builder for database mutations.
- Log admin actions with user ID, route, timestamp, IP, and target resource.
- Run dependency audit, typecheck, and tests before deployment.

## Reporting vulnerabilities

Report security issues privately to the repository owner. Do not open public issues containing exploitable details, credentials, tokens, or personal data.

## Immediate hardening checklist

- Rotate any exposed provider key.
- Confirm the production session secret is strong and unique.
- Protect every route under `/api/admin` with admin authentication.
- Remove hardcoded admin email promotion from runtime code.
- Enable secret scanning and dependency scanning in GitHub.
