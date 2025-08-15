import { useAuth } from '../state/auth.js';
import { useState } from 'react';

interface LinkState {
  step: 'idle' | 'launching' | 'linked' | 'error';
  itemId?: string;
  error?: string;
}

function LinkFlow(): JSX.Element {
  const [state, setState] = useState<LinkState>(() => ({ step: 'idle' }));
  async function launch(): Promise<void> {
    setState({ step: 'launching' });
    try {
      // Placeholder: Normally we'd request a link token from backend then open aggregator widget.
      // Simulate async delay & success.
      await new Promise((r) => setTimeout(r, 500));
      // Simulate obtaining public token then exchanging to get itemId; using mock value.
      const itemId = 'item_mock_123';
      setState({ step: 'linked', itemId });
    } catch (e: unknown) {
      setState({ step: 'error', error: e instanceof Error ? e.message : 'Link failed' });
    }
  }
  return (
    <section style={{ marginTop: '2rem' }}>
      <h2>Bank Link</h2>
      {state.step === 'idle' && (
        <button type="button" onClick={() => void launch()}>
          Link an Account
        </button>
      )}
      {state.step === 'launching' && <p>Opening link flow…</p>}
      {state.step === 'linked' && (
        <p style={{ color: 'green' }}>Linked successfully (mock). Item ID: {state.itemId}</p>
      )}
      {state.step === 'error' && <p style={{ color: 'red' }}>Error: {state.error}</p>}
    </section>
  );
}

export function Dashboard(): JSX.Element {
  // logout function safe (no this usage)
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { user, logout } = useAuth();
  return (
    <main style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <h1>Dashboard</h1>
      <p>
        Logged in as <strong>{user?.email}</strong>
      </p>
      <button
        type="button"
        onClick={() => {
          logout();
        }}
      >
        Logout
      </button>
      <LinkFlow />
    </main>
  );
}
