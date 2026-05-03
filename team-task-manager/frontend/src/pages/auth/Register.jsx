import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { registerUser } from '../../services/api';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member',
  });
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
      const { data } = await registerUser(form);
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-hero auth-hero--register">
        <div className="auth-hero__badge">Onboard Your Team</div>
        <h1>Launch a workspace that matches your backend permissions.</h1>
        <p>
          Create an admin or member account, then start organizing projects, team members, and delivery timelines from one dashboard.
        </p>
        <div className="auth-hero__highlights">
          <div className="auth-highlight">
            <span>Admin Role</span>
            <strong>Create projects and manage project members</strong>
          </div>
          <div className="auth-highlight">
            <span>Member Role</span>
            <strong>Track assigned work and update task progress</strong>
          </div>
          <div className="auth-highlight">
            <span>Live Dashboard</span>
            <strong>Filter by status and spotlight overdue items</strong>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-card__header">
            <p className="eyebrow">Create account</p>
            <h2>Set up your access</h2>
            <p>Your role will control which project management actions are visible in the app.</p>
          </div>

          {error ? <div className="alert alert--error">{error}</div> : null}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Full name</span>
              <input
                name="name"
                type="text"
                placeholder="Manish Kumar"
                value={form.name}
                onChange={updateField}
                required
              />
            </label>

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
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={updateField}
                required
                minLength={6}
              />
            </label>

            <label className="field">
              <span>Role</span>
              <select name="role" value={form.role} onChange={updateField}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <button className="button button--primary button--block" type="submit" disabled={submitting}>
              {submitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="auth-switch">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
