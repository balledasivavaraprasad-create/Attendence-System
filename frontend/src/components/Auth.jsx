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
        }, 500);
      } else {
        setSuccess('Account created! Please log in with your credentials.');
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
    <div className="container" style={{ maxWidth: '480px', marginTop: '40px' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '32px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '8px' }}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isLogin ? 'Access your attendance dashboard' : 'Join as a Teacher or Student'}
          </p>
        </div>

        {!isLogin && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            background: 'rgba(0,0,0,0.3)',
            padding: '4px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px'
          }}>
            <button
              type="button"
              onClick={() => setRole('teacher')}
              className={role === 'teacher' ? 'btn-primary' : 'btn-secondary'}
              style={{ justifyContent: 'center', padding: '8px' }}
            >
              <Shield size={16} /> Teacher
            </button>
            <button
              type="button"
              onClick={() => setRole('student')}
              className={role === 'student' ? 'btn-primary' : 'btn-secondary'}
              style={{ justifyContent: 'center', padding: '8px' }}
            >
              <GraduationCap size={16} /> Student
            </button>
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem'
          }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#6ee7b7',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem'
          }}>
            <CheckCircle2 size={18} /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {!isLogin && (
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} color="var(--text-dark)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>
          )}

          {!isLogin && role === 'student' && (
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Student Image Dataset Folder Name</label>
              <input
                type="text"
                placeholder="e.g. Siva, harsha, hrishi"
                value={studentDatasetName}
                onChange={(e) => setStudentDatasetName(e.target.value)}
                className="input-field"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)', marginTop: '4px', display: 'block' }}>
                Matches folder name inside dataset/
              </span>
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-dark)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
              <input
                type="email"
                required
                placeholder="name@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-dark)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '8px', padding: '12px' }}>
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            <ArrowRight size={18} />
          </button>
        </form>

        {isLogin && (
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>
              Quick Demo Accounts
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button onClick={() => handleQuickLogin('teacher@school.com')} className="btn-secondary" style={{ fontSize: '0.80rem', padding: '6px 8px' }}>
                Teacher
              </button>
              <button onClick={() => handleQuickLogin('siva@school.com')} className="btn-secondary" style={{ fontSize: '0.80rem', padding: '6px 8px' }}>
                Siva (Student)
              </button>
              <button onClick={() => handleQuickLogin('harsha@school.com')} className="btn-secondary" style={{ fontSize: '0.80rem', padding: '6px 8px' }}>
                Harsha (Student)
              </button>
              <button onClick={() => handleQuickLogin('hrishi@school.com')} className="btn-secondary" style={{ fontSize: '0.80rem', padding: '6px 8px' }}>
                Hrishi (Student)
              </button>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
            style={{ background: 'none', border: 'none', color: '#a5b4fc', fontSize: '0.75rem', cursor: 'pointer', textDecoration : 'underline'}}
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already registered? Sign in'}
          </button>
        </div>

      </div>
    </div>
  );
}
