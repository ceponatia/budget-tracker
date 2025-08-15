import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth.js';

export function RegisterPage(): JSX.Element {
  // register function safe (no this usage)
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { register, loading } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const onSubmit = React.useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      try {
        await register({ email, password });
        navigate('/');
      } catch {
        setError('Registration failed');
      }
    },
    [register, email, password, navigate],
  );

  return (
    <main style={{ maxWidth: 400, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <h1>Register</h1>
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
          {loading ? '...' : 'Create Account'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p>
        Have an account? <Link to="/login">Login</Link>
      </p>
    </main>
  );
}
