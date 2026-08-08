import React, { useState } from 'react';
import { Shield, GraduationCap, ArrowRight, Lock, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('teacher');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentDatasetName, setStudentDatasetName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin
      ? { email, password }
      : { email, password, fullName, role, studentDatasetName };

    try {
      const res = await fetch(`http://localhost:5001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      if (isLogin) {
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          onLoginSuccess(data.user, data.token);
        }, 400);
      } else {
        setSuccess('Account created successfully! Please sign in.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div style={{ maxWidth: '420px', margin: '40px auto 0 auto', padding: '0 16px' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
          {isLogin ? 'Sign in to Smart Attendance' : 'Create your account'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {isLogin ? 'Enter your credentials to access the dashboard' : 'Register as a teacher or student'}
        </p>
      </div>

      <div className="ui-card animate-fade-in" style={{ padding: '24px' }}>

        {!isLogin && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            background: 'var(--bg-app)',
            padding: '4px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px'
          }}>
            <button
              type="button"
              onClick={() => setRole('teacher')}
              className={role === 'teacher' ? 'btn-primary' : 'btn-ghost'}
              style={{ justifyContent: 'center', padding: '7px', fontSize: '0.8rem' }}
            >
              <Shield size={15} /> Teacher
            </button>
            <button
              type="button"
              onClick={() => setRole('student')}
              className={role === 'student' ? 'btn-primary' : 'btn-ghost'}
              style={{ justifyContent: 'center', padding: '7px', fontSize: '0.8rem' }}
            >
              <GraduationCap size={15} /> Student
            </button>
          </div>
        )}

        {error && (
          <div className="alert-box alert-error" style={{ marginBottom: '16px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {success && (
          <div className="alert-box alert-success" style={{ marginBottom: '16px' }}>
            <CheckCircle2 size={16} /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {!isLogin && (
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>
          )}

          {!isLogin && role === 'student' && (
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Dataset Folder Name
              </label>
              <input
                type="text"
                placeholder="e.g. Siva, Harsha, Hrishi"
                value={studentDatasetName}
                onChange={(e) => setStudentDatasetName(e.target.value)}
                className="input-field"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
                Folder name in dataset/ for facial recognition matching
              </span>
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="email"
                required
                placeholder="name@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '6px', padding: '10px' }}>
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            <ArrowRight size={16} />
          </button>
        </form>

        {isLogin && (
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: '0.725rem', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' }}>
              Quick Demo Accounts
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button onClick={() => handleQuickLogin('teacher@school.com')} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 8px', justifyContent: 'center' }}>
                Teacher
              </button>
              <button onClick={() => handleQuickLogin('siva@school.com')} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 8px', justifyContent: 'center' }}>
                Siva
              </button>
              <button onClick={() => handleQuickLogin('harsha@school.com')} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 8px', justifyContent: 'center' }}>
                Harsha
              </button>
              <button onClick={() => handleQuickLogin('hrishi@school.com')} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 8px', justifyContent: 'center' }}>
                Hrishi
              </button>
            </div>
          </div>
        )}

      </div>

      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <button
          onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer' }}
        >
          {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>

    </div>
  );
}
