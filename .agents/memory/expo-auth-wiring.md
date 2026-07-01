---
name: Expo mobile auth wiring
description: Clerk JIT-provisioning fix and token getter setup pattern for the PerformanceOS mobile app
---

# Expo Auth Wiring

## The rule
`passwordHash` must be provided as `""` when JIT-provisioning Clerk users into the `users` table, because the column has a NOT NULL constraint but Clerk users have no local password.

**Why:** The DB schema enforces `NOT NULL` on `password_hash`. Without the explicit empty string, the Drizzle insert omits the field and Postgres throws a NOT NULL violation, causing all Clerk-authenticated API calls to fail with a 500.

**How to apply:** In `artifacts/api-server/src/middlewares/requireAuth.ts`, the insert block must include `passwordHash: ""`.

## Token getter pattern
`setAuthTokenGetter` (from `@workspace/api-client-react`) must be called inside a `<ClerkLoaded>` wrapper after `useAuth()` is available. Calling it too early (before Clerk hydrates) results in undefined tokens and 401s on all API calls.

Pattern in `app/_layout.tsx`:
```tsx
function AuthTokenSetup() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(async () => {
      const token = await getToken();
      return token ?? null;
    });
  }, [getToken]);
  return null;
}
// Wrap in <ClerkLoaded><AuthTokenSetup /></ClerkLoaded>
```
