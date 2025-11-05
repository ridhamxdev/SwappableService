import { FormEvent, useState } from 'react';
import api from '../api/client';
import { useAuthStore } from '../store/auth';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const login = useAuthStore(s => s.login);
  const nav = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const { data } = await api.post('/auth/signup', { name, email, password });
      login(data.token, data.user);
      nav('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Signup failed');
    }
  }

  return (
    <form onSubmit={onSubmit} className="card" style={{ maxWidth: 420, margin: '0 auto' }}>
      <div className="card-body form-guidance">
        <div className="form-head">
          <div>
            <h3 className="card-title">Welcome back</h3>
            <p className="card-sub">Use your account to manage slots & swaps.</p>
          </div>
          <div className="progress">
            <div className="dot active"></div><div className="dot"></div><div className="dot"></div>
          </div>
        </div>

        {error && <div className="helper" style={{ borderColor: 'rgba(255,100,100,.45)', color: '#ffd2d2' }}>
          {error}
        </div>}

        {/* fields */}
        <div className="field">
          <label className="label">Name</label>
          <input className="input" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Email</label>
          <input className="input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Password</label>
          <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          <div className="hint">Minimum 6 characters</div>
        </div>

        <div className="flex mt-12">
          <button type="submit" className="btn">Signup</button>
          <a className="ghost" href="/signup">Create account</a>
        </div>
      </div>
    </form>

  );
}
