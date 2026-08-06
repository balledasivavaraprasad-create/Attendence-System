import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('attendance_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('attendance_user');
      }
    }
  }, []);

  const handleLoginSuccess = (userData, token) => {
    setUser(userData);
    localStorage.setItem('attendance_user', JSON.stringify(userData));
    localStorage.setItem('attendance_token', token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('attendance_user');
    localStorage.removeItem('attendance_token');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar user={user} onLogout={handleLogout} />

      <main style={{ flex: 1, paddingBottom: '40px' }}>
        {!user ? (
          <Auth onLoginSuccess={handleLoginSuccess} />
        ) : user.role === 'teacher' ? (
          <TeacherDashboard user={user} />
        ) : (
          <StudentDashboard user={user} />
        )}
      </main>
    </div>
  );
}
