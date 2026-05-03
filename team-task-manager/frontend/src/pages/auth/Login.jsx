import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loginUser } from '../../services/api';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { data } = await loginUser(form);
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-hero">
        <div className="auth-hero__badge">Team Task Manager</div>
        <h1>Stay on top of projects, owners, and deadlines.</h1>
        <p>
          Sign in to manage task assignments, track status changes, and catch overdue work before it slows the team down.
        </p>
        <div className="auth-hero__highlights">
          <div className="auth-highlight">
            <span>JWT Login</span>
            <strong>Secure session-based access</strong>
          </div>
          <div className="auth-highlight">
            <span>Role Controls</span>
            <strong>Admin and member workflows</strong>
          </div>
          <div className="auth-highlight">
            <span>Project Overview</span>
            <strong>Deadlines, owners, and task status in one place</strong>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-card__header">
            <p className="eyebrow">Welcome back</p>
            <h2>Sign in to your workspace</h2>
            <p>Use the same credentials you created from your backend-powered auth flow.</p>
          </div>

          {error ? <div className="alert alert--error">{error}</div> : null}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={updateField}
                required
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                name="password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={updateField}
                required
              />
            </label>

            <button className="button button--primary button--block" type="submit" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="auth-switch">
            Need an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
