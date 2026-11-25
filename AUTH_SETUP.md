# Supabase authentication setup

1. Create a Supabase project at https://supabase.com/dashboard/.
2. In **Authentication → Providers → Email**, enable email/password sign-in and email confirmation. The app does not require user 2FA.
3. To enable phone/SMS registration, open **Authentication → Providers → Phone**, enable Phone, and configure an SMS provider such as Twilio. Enter provider credentials only in Supabase. In **Twilio**, verify that the sender has permission to send to your target countries.
4. In **Authentication → URL Configuration**, set the Site URL to `https://fred482.github.io/messenger/` and add that URL to the redirect allow list. Add `http://localhost:5173/` for local development.
5. In **Project Settings → API**, copy the Project URL and the public publishable key.
6. Add repository Actions variables named `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` under **Settings → Secrets and variables → Actions → Variables**. The Pages workflow uses them on its next run.
7. In the Supabase SQL Editor, run [`20261123093000_profiles_and_contacts.sql`](./supabase/migrations/20261123093000_profiles_and_contacts.sql), [`20261123100000_admin_editor.sql`](./supabase/migrations/20261123100000_admin_editor.sql), [`20261123110000_chat_editor.sql`](./supabase/migrations/20261123110000_chat_editor.sql), and [`20261125120000_phone_auth.sql`](./supabase/migrations/20261125120000_phone_auth.sql), in that order.
8. Register your own account, confirm its email, then promote it to admin in the SQL Editor. Replace the email below with your account's address:

   ```sql
   insert into public.user_roles (user_id, role)
   select id, 'admin'
   from auth.users
   where lower(email) = lower('YOUR_EMAIL')
   on conflict (user_id) do update set role = excluded.role;
   ```

   The visual editor is at `https://fred482.github.io/messenger/#/admin`. Only the admin account can save site settings. The users and contacts tabs are read-only.

For an unauthenticated local chat demo, open `https://fred482.github.io/messenger/#/demo`. To change the local chat appearance, open `https://fred482.github.io/messenger/#/preview` or use the editor link on the sign-in page. Local settings stay in that browser and are never saved to Supabase or published. Status and Momento images remain only in the current session.

Users choose a unique username of 3–24 letters, numbers, or underscores during sign-up. Usernames are normalized to lowercase and enforced as unique in the database. Email sign-up sends a confirmation link automatically. Phone sign-up sends a six-digit SMS code, which must be entered in the app before the account becomes active. Opening it confirms the address and redirects back to the app, where the user is signed in. They can then search for other registered users by username; only confirmed accounts are discoverable. The registration stores the name and username on the Supabase user profile.

## Send from your Gmail address

Supabase's default email service is intended for testing and may be rate-limited or restricted. To send confirmation emails to your users from your own address, configure custom SMTP in the Supabase project's authentication email settings. For Gmail, use `smtp.gmail.com` and a Google app password. Google may require 2-Step Verification on the sender's account to create an app password; this does not enable 2FA for users of the messenger. Enter SMTP credentials only in Supabase settings, never in this repository.

## Local development and key safety

Create `.env.local` with:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-public-publishable-key
```

Restart Vite after changing the file. The publishable key is intended for browser use. Never put a Supabase secret or `service_role` key in a `VITE_` variable or client-side code.
