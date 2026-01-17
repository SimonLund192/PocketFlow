# AUTH_FUTURE: swapping in real authentication later

This app currently runs in **dev-mode multi-user**: the frontend picks an active user via the Dev User Switcher and the backend scopes most user-owned resources by that selected user.

This doc describes the **interfaces we rely on today** and the **minimal changes** needed to swap in real auth later (JWT/cookies) without rewriting routes or the frontend API layer.

## Current state (dev user context)

### Backend

- User scoping is derived from the request header:
  - `X-User-Id: <string>`
- The stable dependency interface for user-scoped endpoints is:
  - `app.auth.get_user_context()`
  - returns `app.auth.UserContext` with `ctx.user_id`

Today, `get_user_context()` internally depends on `get_current_user_id()` which validates the header and returns a trimmed string.

### Frontend

- The stable interface for “who is the active user?” is:
  - `frontend/lib/api.ts:getSelectedUserId()`
- `frontend/lib/api.ts` is responsible for attaching the header:
  - `X-User-Id` is added by `getAuthHeaders()` when a selected user exists.

No page/component should read `localStorage['selected_user_id']` directly.

## How to migrate to real auth later (no code yet)

The goal is to avoid changing every route signature. We already route all user-scoped endpoints through a single dependency (`get_user_context`).

### Backend migration checklist

1. Decide auth transport:
   - Cookie session, or
   - `Authorization: Bearer <JWT>`
2. Implement a new internal dependency (example name):
   - `get_authenticated_user_context()`
   - validates cookie/JWT and returns `UserContext(user_id=...)`
3. Switch `get_user_context()` to delegate to the real auth dependency instead of `get_current_user_id()`.
   - Keep the return type the same (`UserContext`).
   - Keep error semantics consistent (e.g., 401/403) once auth exists.
4. Remove (or restrict) dev-only endpoints (`/api/users`) if needed.

### Frontend migration checklist

1. Stop using `getSelectedUserId()` for production.
2. Update `getAuthHeaders()` in `frontend/lib/api.ts`:
   - If JWT: attach `Authorization: Bearer ...`
   - If cookies: rely on `credentials: 'include'` and do not attach `Authorization`.
3. Keep the rest of the frontend calling `api.*` unchanged.

## Guardrails (what tests should enforce)

- User-scoped backend endpoints must fail when user context is missing.
- Frontend API calls to user-scoped endpoints must consistently include the user context mechanism.

