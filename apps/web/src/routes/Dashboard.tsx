import { useAuth } from '../state/auth.js';

export function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <main style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <h1>Dashboard</h1>
      <p>Logged in as <strong>{user?.email}</strong></p>
      <button onClick={logout}>Logout</button>
    </main>
  );
}
