# Clerk authentication setup

1. Create a Clerk application at https://dashboard.clerk.com/.
2. Enable email address sign-in and email verification codes in the Clerk dashboard.
3. Configure the allowed sign-up methods and redirect URLs for the app's origin.
4. Copy the **publishable key** into `.env.local`:

   ```env
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

5. Restart the Vite server. The app shows Clerk's sign-in or sign-up form when signed out and the messenger when signed in.
6. Configure multi-factor authentication and passkey availability in Clerk's dashboard and user security settings. Available factors depend on the Clerk plan, platform, and account policy.

Only the publishable key is used by this browser application. Never put a Clerk secret key in a `VITE_` variable or client-side code.

## GitHub Pages

In **Settings → Pages**, set the source to **GitHub Actions**. The workflow deploys on each push to `main`.

Add a repository Actions variable named `VITE_CLERK_PUBLISHABLE_KEY` under **Settings → Secrets and variables → Actions → Variables**. Set the Clerk application's allowed origin and redirect URLs to the deployed Pages URL (`https://fred482.github.io/messenger/`). The Pages build uses this variable; without it, the deployed app shows the setup screen.