import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth.js';

export function LoginPage() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login({ email, password });
      navigate('/');
    } catch (e) {
      setError('Login failed');
    }
  }

  return (
    <main style={{ maxWidth: 400, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <h1>Login</h1>
      <form onSubmit={onSubmit}>
        <label>Email<br /><input value={email} onChange={e => setEmail(e.target.value)} required type="email" /></label><br />
        <label>Password<br /><input value={password} onChange={e => setPassword(e.target.value)} required type="password" /></label><br />
        <button disabled={loading} type="submit">{loading ? '...' : 'Login'}</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p>No account? <Link to="/register">Register</Link></p>
    </main>
  );
}
