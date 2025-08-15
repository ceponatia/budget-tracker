import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth.js';

export function LoginPage(): JSX.Element {
  // login function safe (no this usage)
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { login, loading } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const onSubmit = React.useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      try {
        await login({ email, password });
        navigate('/');
      } catch {
        setError('Login failed');
      }
    },
    [login, email, password, navigate],
  );

  return (
    <main style={{ maxWidth: 400, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <h1>Login</h1>
      <form
        onSubmit={(e) => {
          void onSubmit(e);
        }}
      >
        <label>
          Email
          <br />
          <input
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            required
            type="email"
          />
        </label>
        <br />
        <label>
          Password
          <br />
          <input
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            required
            type="password"
          />
        </label>
        <br />
        <button disabled={loading} type="submit">
          {loading ? '...' : 'Login'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p>
        No account? <Link to="/register">Register</Link>
      </p>
    </main>
  );
}
