import { useAuth } from '../state/auth.js';

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
    </main>
  );
}
