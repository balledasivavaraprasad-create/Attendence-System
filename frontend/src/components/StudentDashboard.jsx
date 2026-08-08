import React, { useState, useEffect } from 'react';
import { GraduationCap, Award, BookOpen, Calendar, CheckCircle2, XCircle, AlertTriangle, Percent, Filter } from 'lucide-react';

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
        <p style={{ color: 'var(--text-secondary)' }}>Loading attendance data...</p>
      </div>
    );
  }

  const { overallPercentage = 0, totalConducted = 0, totalAttended = 0, subjectStats = [] } = dashboardData || {};

  const filteredHistory = filterSubject === 'ALL'
    ? history
    : history.filter(h => h.subject_code === filterSubject);

  return (
    <div className="container animate-fade-in">
      
      <div className="ui-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <GraduationCap size={22} color="var(--accent-primary)" />
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                Overview for {user.fullName}
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Track your subject-wise attendance logs and minimum requirement metrics.
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: 'var(--bg-app)',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase', display: 'block' }}>
                Overall Percentage
              </span>
              <span style={{
                fontSize: '1.6rem',
                fontWeight: '700',
                color: overallPercentage >= 75 ? 'var(--accent-success)' : overallPercentage >= 65 ? 'var(--accent-warning)' : 'var(--accent-danger)'
              }}>
                {overallPercentage}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-cols-3" style={{ marginBottom: '24px' }}>
        <div className="ui-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            padding: '10px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(59, 130, 246, 0.1)',
            color: '#60a5fa'
          }}>
            <BookOpen size={22} />
          </div>
          <div>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: '500' }}>Enrolled Subjects</p>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>{subjectStats?.length || 0}</h3>
          </div>
        </div>

        <div className="ui-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            padding: '10px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(16, 185, 129, 0.1)',
            color: '#34d399'
          }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: '500' }}>Attended / Total</p>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>{totalAttended} / {totalConducted}</h3>
          </div>
        </div>

        <div className="ui-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            padding: '10px',
            borderRadius: 'var(--radius-sm)',
            background: overallPercentage >= 75 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: overallPercentage >= 75 ? '#34d399' : '#f87171'
          }}>
            <Award size={22} />
          </div>
          <div>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: '500' }}>Threshold Status</p>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: overallPercentage >= 75 ? '#34d399' : '#f87171' }}>
              {overallPercentage >= 75 ? 'Eligible for Exams' : 'Below 75% Criteria'}
            </h3>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Percent size={18} color="var(--accent-primary)" /> Subject Attendance Breakdown
        </h3>

        <div className="grid-cols-2" style={{ gap: '16px' }}>
          {subjectStats && subjectStats.map((item) => {
            const isHigh = item.percentage >= 75;
            const isMedium = item.percentage >= 65 && item.percentage < 75;
            const progressClass = isHigh ? 'progress-high' : isMedium ? 'progress-medium' : 'progress-low';

            return (
              <div key={item.subjectId} className="ui-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <span className="badge badge-neutral" style={{ marginBottom: '6px' }}>
                      {item.sectionName}
                    </span>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-primary)' }}>{item.subjectName}</h4>
                    <span style={{ fontSize: '0.775rem', color: 'var(--text-tertiary)' }}>{item.subjectCode}</span>
                  </div>

                  <span style={{
                    fontSize: '1.4rem',
                    fontWeight: '700',
                    color: isHigh ? 'var(--accent-success)' : isMedium ? 'var(--accent-warning)' : 'var(--accent-danger)'
                  }}>
                    {item.percentage}%
                  </span>
                </div>

                <div className="progress-bar-bg" style={{ marginBottom: '12px' }}>
                  <div
                    className={`progress-bar-fill ${progressClass}`}
                    style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>Sessions: <strong>{item.attendedSessions}</strong> of {item.totalSessions}</span>
                  {isHigh ? (
                    <span className="badge badge-present"><CheckCircle2 size={12} /> Satisfactory</span>
                  ) : (
                    <span className="badge badge-absent"><AlertTriangle size={12} /> Attention</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="ui-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="var(--accent-primary)" /> Attendance Records
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} color="var(--text-tertiary)" />
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="select-field"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
            >
              <option value="ALL">All Subjects</option>
              {subjectStats && subjectStats.map(s => (
                <option key={s.subjectId} value={s.subjectCode}>{s.subjectName}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredHistory.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)' }}>
                  <th style={{ padding: '10px 12px', fontWeight: '600' }}>Subject</th>
                  <th style={{ padding: '10px 12px', fontWeight: '600' }}>Section</th>
                  <th style={{ padding: '10px 12px', fontWeight: '600' }}>Date & Time</th>
                  <th style={{ padding: '10px 12px', fontWeight: '600' }}>Mode</th>
                  <th style={{ padding: '10px 12px', fontWeight: '600', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>{log.subject_name}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{log.section_name}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{log.date} <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>{log.time}</span></td>
                    <td style={{ padding: '12px', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>{log.mode}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <span className={log.status === 'PRESENT' ? 'badge badge-present' : 'badge badge-absent'}>
                        {log.status === 'PRESENT' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            No attendance records found.
          </div>
        )}
      </div>

    </div>
  );
}
