# Supabase authentication setup

1. Create a Supabase project at https://supabase.com/dashboard/.
2. In **Authentication → Providers → Email**, enable email/password sign-in and email confirmation. The app does not require user 2FA.
3. In **Authentication → URL Configuration**, set the Site URL to `https://fred482.github.io/messenger/` and add that URL to the redirect allow list. Add `http://localhost:5173/` for local development.
4. In **Project Settings → API**, copy the Project URL and the public publishable key.
5. Add repository Actions variables named `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` under **Settings → Secrets and variables → Actions → Variables**. The Pages workflow uses them on its next run.

After sign-up, Supabase sends the email confirmation link automatically. Once the user opens it, they can sign in with their email and password.

## Send from your Gmail address

Supabase's default email service is intended for testing and may be rate-limited or restricted. To send confirmation emails to your users from your own address, configure custom SMTP in the Supabase project's authentication email settings. For Gmail, use `smtp.gmail.com` and a Google app password. Google may require 2-Step Verification on the sender's account to create an app password; this does not enable 2FA for users of the messenger. Enter SMTP credentials only in Supabase settings, never in this repository.

## Local development and key safety

Create `.env.local` with:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-public-publishable-key
```

Restart Vite after changing the file. The publishable key is intended for browser use. Never put a Supabase secret or `service_role` key in a `VITE_` variable or client-side code.
