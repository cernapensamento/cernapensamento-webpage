---
status: accepted
---

# Multi-role RBAC with atomic permissions and DB-backed RLS evaluation

Cerna Pensamento previously enforced authorization through a single `users.role` enum (`reader`, `guest`, `member`, `founder`, `admin`) mirrored into Supabase JWT `app_metadata`. That single-role model prevented users from holding overlapping responsibilities (such as a writer who is also a social media manager or an administrator) and overloaded `users.role` with both authorization checks and public editorial badges. We decided to replace it via a full expand–contract migration with a multi-role RBAC system built around atomic `resource:action` **Permissions**:

1. **Multi-role RBAC with atomic permissions and roles-only assignment.** Users can hold multiple simultaneous **Roles** in `public.user_roles`. Each Role maps to atomic `resource:action` **Permissions** (e.g., `publications:create`, `publications:write_unlimited`, `publications:review`, `publications:publish`, `publications:pin`, `publications:update_any`, `publications:delete_any`, `users:assign_role`, `users:revoke_role`, `comments:delete_any`, `tags:create`/`update`/`delete`, `media:upload_publication`/`delete_any`, `desk:access`, `ai:translate`) in `public.role_permissions`, versioned in migrations and mirrored in TypeScript constants. Administrators assign Roles only (no direct per-user permission overrides). Existing contextual rules—resource ownership, publication `status`, and Guest Author quotas (applied when a user holds `publications:create` without `publications:write_unlimited`)—remain explicit DAL and RLS conditions rather than a generic ABAC policy engine.
2. **DB-backed `has_permission(text)` for RLS instead of JWT claims.** Postgres RLS and `storage.objects` policies call a `STABLE SECURITY DEFINER` `public.has_permission(text)` function against `user_roles` and `role_permissions`. This ensures role grants and revocations take effect immediately without waiting for JWT refresh, removes `sync_user_role_to_auth()` and legacy Spanish role aliases, and enforces fail-closed zero-permission behavior when a user has no roles alongside a trigger that prevents removing the last `admin`.
3. **Public editorial visibility via `roles.is_public`.** `public.roles` carries an `is_public` flag (`founder`, `member`, `guest` = `true`; `admin`, `reader`, and future operational roles = `false`). Anonymous (`anon`) RLS on `user_roles` only exposes `is_public = true` rows, preventing internal management roles from leaking publicly. Public author badges resolve by fixed priority (`founder` > `member` > `guest`), and homepage Columnists filter on `founder`.

## Considered Options

- **Dynamic ABAC rule engine and/or organizational Departments table:** Rejected because Cerna's team is small (5 core members); overlapping roles plus existing resource/ownership/quota checks cover current and near-term needs without adding department-scoping complexity.
- **Syncing role/permission arrays into JWT `app_metadata`:** Rejected because revoking a role would remain ineffective until JWT expiry, and keeping `auth.users.raw_app_meta_data` synced across a many-to-many join table adds trigger fragility.
- **Separate `is_columnist` / `editorial_title` profile columns for public display:** Rejected in favor of `roles.is_public` + priority resolution so editorial identity stays automatically aligned with assigned editorial roles while hiding internal roles like `admin`.

## Consequences

- Adding a future role (such as `social_media_manager`) requires only inserting the role and its atomic permissions in a migration and matching TypeScript constants—no schema changes or role-name conditionals in application code.
- `users.role` and all legacy role aliases (`fundador`, `escritor`, `lector`, `usuario`, `invitado`, `convidado`, `profile.rol`) are removed at the end of the expand–contract migration, leaving `user_roles` and `role_permissions` as the single source of truth.
- `getColumnists()` no longer includes users who hold only `admin`; an administrator appears as a columnist only if they also hold `founder`.
