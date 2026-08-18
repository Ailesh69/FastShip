// Dev-only. Imported automatically by @reticlehq/vite-plugin, so you do not need to import it.
// Self-guards on import.meta.env.DEV, so it is a no-op in a production build.
import { registerCapabilities, registerStore } from '@reticlehq/react';
import { STORAGE_KEY } from './context/auth';

if (import.meta.env.DEV) {
  // ── The auth session ─────────────────────────────────────────────────────────────────────────
  // The app's one piece of cross-page state. It lives in React context (AuthProvider), but context
  // cannot be read from outside a component — so this reads the same localStorage entry the context
  // hydrates from and writes back to, which is the only representation reachable from here.
  //
  // Registered as a bare GETTER, not a store: there is nothing to subscribe to, so reads are
  // pull-only and act summaries will show empty stateDiffs. Reading it is what matters — it is how
  // the agent tells "the form refused to submit" from "it logged in and the redirect broke".
  //
  // The JWT is deliberately NOT exposed. Its presence is the only part worth asserting on, and a
  // bearer token has no business travelling into agent transcripts or logs.
  registerStore('auth', () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const { token, ...session } = JSON.parse(raw);
      return { ...session, hasToken: Boolean(token) };
    } catch {
      return null;
    }
  });

  registerCapabilities({
    // FieldRow stamps `field-<name>` on every input and `error-<name>` on its inline message, so
    // every form on the site (login + all three sign-up roles) is addressable from that one
    // component. Listed here are the ones the login flow below actually touches.
    testids: [
      'field-email',
      'field-password',
      'error-email',
      'error-password',
      'acct-client',
      'acct-seller',
      'acct-partner',
      'error-accountType',
      'login-submit',
      'login-form-error',
    ],
    signals: [], // names you pass to reticle.signal()
    stores: ['auth'],
    flows: [
      {
        // The guard that stops a submit reaching the backend at all. Worth pinning because it is
        // pure client-side state: nothing in the network log would ever show it regressing.
        name: 'login-validation-blocks-empty-submit',
        steps: [
          'navigate to /login',
          'click login-submit with every field empty',
          'expect error-email, error-password and error-accountType to render',
          'expect the URL to stay on /login and auth to stay null',
        ],
      },
      {
        // The other half: a filled form must reach POST /<role>/token and surface whatever comes
        // back. A dead backend has to read as an error in the UI, never as a silent no-op.
        name: 'login-submits-credentials-to-backend',
        steps: [
          'navigate to /login',
          'click acct-client, fill field-email and field-password',
          'click login-submit',
          'expect a POST to the role token endpoint, and either a session in auth or login-form-error rendered',
        ],
      },
    ],
  });
}
