import React, { useState, useEffect } from 'react';
import { GraduationCap, Award, BookOpen, Calendar, CheckCircle2, XCircle, AlertTriangle, Percent, ChevronRight } from 'lucide-react';

export default function StudentDashboard({ user }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState('ALL');

  useEffect(() => {
    fetchStudentData();
  }, [user]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const [dashRes, histRes] = await Promise.all([
        fetch(`http://localhost:5001/api/student/dashboard/${user.id}`),
        fetch(`http://localhost:5001/api/student/attendance/${user.id}`)
      ]);

      const dash = await dashRes.json();
      const hist = await histRes.json();

      setDashboardData(dash);
      setHistory(hist);
    } catch (err) {
      console.error("Error fetching student dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading your attendance portfolio...</p>
      </div>
    );
  }

  const { overallPercentage, totalConducted, totalAttended, subjectStats } = dashboardData || {};

  const filteredHistory = filterSubject === 'ALL'
    ? history
    : history.filter(h => h.subject_code === filterSubject);

  return (
    <div className="container animate-fade-in">
      
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '28px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <GraduationCap size={24} color="#818cf8" />
              <h2 style={{ fontSize: '1.6rem', fontWeight: '800' }}>Welcome, {user.fullName}</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Here is your section & subject-wise attendance breakdown.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Overall Attendance</span>
              <h3 style={{
                fontSize: '2rem',
                fontWeight: '800',
                color: overallPercentage >= 75 ? '#34d399' : overallPercentage >= 65 ? '#fbbf24' : '#f87171'
              }}>
                {overallPercentage}%
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-cols-3" style={{ marginBottom: '28px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <BookOpen size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Enrolled Subjects</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{subjectStats?.length || 0}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <CheckCircle2 size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Classes Attended</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{totalAttended} / {totalConducted}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Award size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Target Status</p>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: overallPercentage >= 75 ? '#34d399' : '#f87171' }}>
              {overallPercentage >= 75 ? 'Eligible for Exams' : 'Attendance Warning'}
            </h3>
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Percent size={20} color="#818cf8" /> Section & Subject Attendance Breakdown
      </h3>

      <div className="grid-cols-2" style={{ gap: '20px', marginBottom: '32px' }}>
        {subjectStats && subjectStats.map((item) => {
          const isHigh = item.percentage >= 75;
          const isMedium = item.percentage >= 65 && item.percentage < 75;
          const progressClass = isHigh ? 'progress-high' : isMedium ? 'progress-medium' : 'progress-low';

          return (
            <div key={item.subjectId} className="glass-panel glass-panel-interactive" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <span className="badge badge-primary" style={{ marginBottom: '6px' }}>
                    {item.sectionName}
                  </span>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: '700' }}>{item.subjectName}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Code: {item.subjectCode}</span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: '1.6rem',
                    fontWeight: '800',
                    color: isHigh ? '#34d399' : isMedium ? '#fbbf24' : '#f87171'
                  }}>
                    {item.percentage}%
                  </span>
                </div>
              </div>

              <div className="progress-bar-bg" style={{ marginBottom: '14px' }}>
                <div
                  className={`progress-bar-fill ${progressClass}`}
                  style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span>Sessions: <strong>{item.attendedSessions}</strong> / {item.totalSessions}</span>
                {isHigh ? (
                  <span className="badge badge-present"><CheckCircle2 size={12} /> Good</span>
                ) : (
                  <span className="badge badge-absent"><AlertTriangle size={12} /> Low</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} color="#34d399" /> Attendance History & Logs
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Filter Subject:</span>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="select-field"
              style={{ width: 'auto', padding: '6px 12px' }}
            >
              <option value="ALL">All Subjects</option>
              {subjectStats && subjectStats.map(s => (
                <option key={s.subjectId} value={s.subjectCode}>{s.subjectName}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredHistory.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredHistory.map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{log.subject_name}</span>
                    <span className="badge badge-primary">{log.section_name}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Date: {log.date} | Time: {log.time} | Mode: {log.mode}
                  </span>
                </div>

                <span className={log.status === 'PRESENT' ? 'badge badge-present' : 'badge badge-absent'}>
                  {log.status === 'PRESENT' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No attendance records found for this filter.
          </div>
        )}
      </div>

    </div>
  );
}
