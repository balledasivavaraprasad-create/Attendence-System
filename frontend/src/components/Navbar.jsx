import React from 'react';
import { LogOut, UserCheck, Shield, GraduationCap } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', marginBottom: '24px' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
          }}>
            <UserCheck size={24} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '800', background: 'linear-gradient(90deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Smart Attendance
            </h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>
              Face Recognition System
            </span>
          </div>
        </div>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {user.role === 'teacher' ? (
                <Shield size={16} color="#818cf8" />
              ) : (
                <GraduationCap size={16} color="#34d399" />
              )}
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>{user.fullName}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {user.role} {user.studentDatasetName ? `(${user.studentDatasetName})` : ''}
                </p>
              </div>
            </div>

            <button onClick={onLogout} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        ) : (
          <div className="badge badge-primary">
            Authentication Portal
          </div>
        )}

      </div>
    </header>
  );
}
