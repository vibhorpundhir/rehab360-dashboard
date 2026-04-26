## Goal
Capture a user's **Name** during signup so the app (sidebar, greeting, settings, clinical reports) shows a real name instead of falling back to the email prefix.

## Why this works cleanly
- The DB trigger `handle_new_user()` already reads `NEW.raw_user_meta_data->>'name'` and writes it into `profiles.name`. No DB changes needed.
- `AuthContext.buildProfile` already reads `authUser.user_metadata?.name` first, then falls back to email prefix. So as soon as we pass `name` in signup metadata, it lights up everywhere automatically.
- Login flow stays untouched — still just email + password (per the previous "frictionless auth" requirement).

## Changes — `src/pages/AuthPage.tsx`

1. **State**
   - Add `const [name, setName] = useState("");`
   - Add `User` icon import from lucide-react.

2. **Signup-only Name field** (rendered only when `!isLogin`)
   - Placed above the Email field.
   - Same glass input style as Email/Password (icon-prefixed, `bg-secondary/50 border-white/10`).
   - `required` only in signup mode; trimmed before submit.
   - Min length 2, max 60 (lightweight client-side validation with a toast on failure — no schema lib needed for one field).

3. **Submit handler**
   - In the signup branch, pass metadata:
     ```ts
     await supabase.auth.signUp({
       email,
       password,
       options: {
         emailRedirectTo: window.location.origin,
         data: { name: name.trim() },
       },
     });
     ```
   - Reset `name` on toggling between Login/Signup so stale values don't leak.
   - Login branch is unchanged.

4. **Toggle behavior**
   - When user switches from Signup → Login, clear the `name` state.

## Why no other files need to change
- `AuthContext.tsx` already prefers `user_metadata.name` → sidebar, greeting, settings display name will instantly use the entered name.
- `handle_new_user` trigger writes `name` into `public.profiles` automatically on signup.
- Settings page already syncs display-name updates back to `auth.updateUser({ data: { name } })`, so the same field stays editable later.

## Out of scope (intentionally)
- No "Forgot password" / magic link UI (kept frictionless per prior decision).
- No DB migrations, no RLS changes, no edge function changes.
- Login form stays as **Email + Password** only.

## Acceptance criteria
- Signup screen shows three fields: **Name**, **Email**, **Password**.
- Submitting with an empty/too-short name shows a toast and blocks signup.
- After successful signup, the user lands on `/dashboard` and the sidebar/greeting shows the entered name (not the email prefix).
- Querying `profiles` for the new user shows `name` populated.
- Login screen is unchanged (Email + Password only).
