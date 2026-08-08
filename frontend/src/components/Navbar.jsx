import React from 'react';
import { LogOut, UserCheck, Shield, GraduationCap } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  return (
    <header style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div className="container" style={{
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        paddingTop: '12px',
        paddingBottom: '12px'
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-primary)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <UserCheck size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Smart Attendance
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              Face Recognition Attendance System
            </p>
          </div>
        </div>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '5px 12px',
              background: 'var(--bg-app)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)'
            }}>
              {user.role === 'teacher' ? (
                <Shield size={16} color="#60a5fa" />
              ) : (
                <GraduationCap size={16} color="#34d399" />
              )}
              <div style={{ lineHeight: '1.2' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>{user.fullName}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>
                  {user.role} {user.studentDatasetName ? `• ${user.studentDatasetName}` : ''}
                </p>
              </div>
            </div>

            <button onClick={onLogout} className="btn-secondary" style={{ padding: '7px 12px', fontSize: '0.8rem' }}>
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        ) : (
          <span className="badge badge-neutral">
            Sign In Required
          </span>
        )}

      </div>
    </header>
  );
}
