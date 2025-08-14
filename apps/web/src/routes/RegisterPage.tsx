import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth.js';

export function RegisterPage() {
  const { register, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await register({ email, password });
      navigate('/');
    } catch (e) {
      setError('Registration failed');
    }
  }

  return (
    <main style={{ maxWidth: 400, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <h1>Register</h1>
      <form onSubmit={onSubmit}>
        <label>Email<br /><input value={email} onChange={e => setEmail(e.target.value)} required type="email" /></label><br />
        <label>Password<br /><input value={password} onChange={e => setPassword(e.target.value)} required type="password" /></label><br />
        <button disabled={loading} type="submit">{loading ? '...' : 'Create Account'}</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p>Have an account? <Link to="/login">Login</Link></p>
    </main>
  );
}
