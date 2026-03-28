# Auth Flow Analysis

The auth flow works as follows:

1. DashboardLayout calls useAuth() which calls trpc.auth.me.useQuery()
2. If user is null (not authenticated), DashboardLayout renders a static login page with a "Sign in" button
3. The Sign in button navigates to getLoginUrl() which goes to the Manus OAuth portal
4. After OAuth, the callback at /api/oauth/callback sets a cookie and redirects to "/"
5. On return, auth.me query runs again and now returns the user

Potential issues found:
- The ScriptWriter page at /project/:projectId/script/:scriptId is OUTSIDE DashboardLayout, so it has no auth gate. If an unauthenticated user hits this route, tRPC calls will fail with UNAUTHORIZED but there's no redirect to login.
- The Home page calls trpc.project.list.useQuery() which is a protectedProcedure. If user is not authenticated, this will throw UNAUTHORIZED error. But DashboardLayout should gate this.
- No automatic redirect loop detected - DashboardLayout shows a static login page, doesn't auto-redirect.
- useAuth has redirectOnUnauthenticated option but it defaults to false, so no auto-redirect.

The key concern: DashboardLayout correctly shows login screen for unauthenticated users. No loop.
ScriptWriter needs auth protection added.
