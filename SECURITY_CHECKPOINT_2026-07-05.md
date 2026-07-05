# Security checkpoint — 2026-07-05

Branch: `admin/add-brobroplzcheck`

Implemented changes:

1. Added a one-time migration that promotes the registered second admin account to full access.
2. Added central ownership checks to protected tRPC procedures for project and character IDs.
3. Registered the migration in Drizzle's migration journal.

Deployment note: merge `admin/add-brobroplzcheck` into `main`, deploy, then run the normal database migration command.
