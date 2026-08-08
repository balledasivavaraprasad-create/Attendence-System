import React, { useState, useEffect, useRef } from 'react';
import { Camera, Users, BookOpen, PlusCircle, CheckCircle2, XCircle, AlertCircle, RefreshCw, Upload, Play, Layers, FileText } from 'lucide-react';

export default function TeacherDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('take-attendance');

  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const [useWebcam, setUseWebcam] = useState(true);
  const [cameraStream, setCameraStream] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLiveSessionRunning, setIsLiveSessionRunning] = useState(false);
  const [recognizedPresentStudents, setRecognizedPresentStudents] = useState([]);
  const [latestMatchToast, setLatestMatchToast] = useState(null);
  const liveIntervalRef = useRef(null);
  const isProcessingFrameRef = useRef(false);

  const [capturedImage, setCapturedImage] = useState(null);
  const [attendanceResult, setAttendanceResult] = useState(null);
  const [scannerError, setScannerError] = useState('');

  const [newSectionName, setNewSectionName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectSectionId, setNewSubjectSectionId] = useState('');

  const [enrollStudentId, setEnrollStudentId] = useState('');
  const [enrollSectionId, setEnrollSectionId] = useState('');
  const [enrollSubjectId, setEnrollSubjectId] = useState('');

  const [datasetStudentName, setDatasetStudentName] = useState('');
  const [datasetImage, setDatasetImage] = useState(null);

  const [feedback, setFeedback] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [secRes, subRes, stuRes] = await Promise.all([
        fetch('http://localhost:5001/api/teacher/sections'),
        fetch('http://localhost:5001/api/teacher/subjects'),
        fetch('http://localhost:5001/api/teacher/students')
      ]);

      const secData = await secRes.json();
      const subData = await subRes.json();
      const stuData = await stuRes.json();

      setSections(secData);
      setSubjects(subData);
      setAllStudents(stuData);

      if (secData.length > 0) {
        setSelectedSection(secData[0].id.toString());
        setEnrollSectionId(secData[0].id.toString());
        setNewSubjectSectionId(secData[0].id.toString());
      }
    } catch (err) {
      console.error("Error loading teacher data:", err);
    }
  };

  const availableSubjects = subjects.filter(
    s => s.section_id.toString() === selectedSection.toString()
  );

  useEffect(() => {
    if (availableSubjects.length > 0 && !selectedSubject) {
      setSelectedSubject(availableSubjects[0].id.toString());
    }
  }, [selectedSection, availableSubjects]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setScannerError("Camera permission denied or camera not found. Upload image manually below.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'take-attendance' && useWebcam) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab, useWebcam]);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    return canvas.toDataURL('image/jpeg');
  };

  const startLiveSession = () => {
    if (!selectedSection || !selectedSubject) {
      setScannerError("Please select both a Section and a Subject.");
      return;
    }
    setScannerError('');
    setAttendanceResult(null);
    setRecognizedPresentStudents([]);
    setLatestMatchToast(null);
    setIsLiveSessionRunning(true);
  };

  useEffect(() => {
    if (isLiveSessionRunning && useWebcam) {
      liveIntervalRef.current = setInterval(async () => {
        if (isProcessingFrameRef.current) return;
        const frameB64 = captureFrame();
        if (!frameB64) return;

        isProcessingFrameRef.current = true;
        try {
          const res = await fetch('http://localhost:5001/api/teacher/recognize-frame', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sectionId: parseInt(selectedSection),
              subjectId: parseInt(selectedSubject),
              image: frameB64
            })
          });
          const data = await res.json();
          if (data.recognizedStudents && data.recognizedStudents.length > 0) {
            setRecognizedPresentStudents(prev => {
              const updated = [...prev];
              let newlyAdded = null;
              data.recognizedStudents.forEach(st => {
                if (!updated.some(u => u.studentId === st.studentId)) {
                  updated.push(st);
                  newlyAdded = st;
                }
              });
              if (newlyAdded) {
                setLatestMatchToast(newlyAdded);
                setTimeout(() => setLatestMatchToast(null), 3000);
              }
              return updated;
            });
          }
        } catch (err) {
          console.error("Frame recognition error:", err);
        } finally {
          isProcessingFrameRef.current = false;
        }
      }, 500);
    } else {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }
      isProcessingFrameRef.current = false;
    }

    return () => {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
      }
      isProcessingFrameRef.current = false;
    };
  }, [isLiveSessionRunning, useWebcam, selectedSection, selectedSubject]);

  const stopAndFinalizeSession = async () => {
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }
    setIsLiveSessionRunning(false);
    setIsScanning(true);
    setScannerError('');

    const presentIds = recognizedPresentStudents.map(s => s.studentId);

    try {
      const res = await fetch('http://localhost:5001/api/teacher/finalize-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: parseInt(selectedSection),
          subjectId: parseInt(selectedSubject),
          teacherId: user.id,
          presentStudentIds: presentIds
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to finalize attendance");

      setAttendanceResult(data);
    } catch (err) {
      setScannerError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleProcessAttendance = async () => {
    setScannerError('');
    setAttendanceResult(null);
    setIsScanning(true);

    let imagePayload = capturedImage;
    if (useWebcam) {
      imagePayload = captureFrame();
    }

    if (!selectedSection || !selectedSubject) {
      setScannerError("Please select both a Section and a Subject.");
      setIsScanning(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5001/api/teacher/take-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: parseInt(selectedSection),
          subjectId: parseInt(selectedSubject),
          image: imagePayload,
          teacherId: user.id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to log attendance");

      setAttendanceResult(data);
    } catch (err) {
      setScannerError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5001/api/teacher/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSectionName, teacherId: user.id })
      });
      if (res.ok) {
        setNewSectionName('');
        setFeedback('Section added successfully!');
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5001/api/teacher/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newSubjectCode,
          name: newSubjectName,
          sectionId: parseInt(newSubjectSectionId),
          teacherId: user.id
        })
      });
      if (res.ok) {
        setNewSubjectCode('');
        setNewSubjectName('');
        setFeedback('Subject created successfully!');
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5001/api/teacher/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: parseInt(enrollStudentId),
          sectionId: parseInt(enrollSectionId),
          subjectId: parseInt(enrollSubjectId)
        })
      });
      const data = await res.json();
      setFeedback(data.message || 'Student enrolled!');
    } catch (err) { console.error(err); }
  };

  const handleRegisterDataset = async (e) => {
    e.preventDefault();
    if (!datasetImage || !datasetStudentName) return;
    try {
      const res = await fetch('http://localhost:5001/api/teacher/register-student-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetName: datasetStudentName,
          image: datasetImage
        })
      });
      const data = await res.json();
      setFeedback(data.message || 'Face registered successfully!');
      setDatasetStudentName('');
      setDatasetImage(null);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="container animate-fade-in">
      
      <div className="grid-cols-3" style={{ marginBottom: '24px' }}>
        <div className="ui-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' }}>
            <Users size={22} />
          </div>
          <div>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: '500' }}>Registered Students</p>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>{allStudents.length}</h3>
          </div>
        </div>

        <div className="ui-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(14, 165, 233, 0.1)', color: '#38bdf8' }}>
            <Layers size={22} />
          </div>
          <div>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: '500' }}>Active Sections</p>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>{sections.length}</h3>
          </div>
        </div>

        <div className="ui-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
            <BookOpen size={22} />
          </div>
          <div>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: '500' }}>Total Subjects</p>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>{subjects.length}</h3>
          </div>
        </div>
      </div>

      <div className="tab-navigation">
        <button
          onClick={() => setActiveTab('take-attendance')}
          className={`tab-button ${activeTab === 'take-attendance' ? 'active' : ''}`}
        >
          <Camera size={16} /> Take Attendance
        </button>
        <button
          onClick={() => setActiveTab('classes-enrollment')}
          className={`tab-button ${activeTab === 'classes-enrollment' ? 'active' : ''}`}
        >
          <PlusCircle size={16} /> Sections & Courses
        </button>
        <button
          onClick={() => setActiveTab('dataset-manager')}
          className={`tab-button ${activeTab === 'dataset-manager' ? 'active' : ''}`}
        >
          <Upload size={16} /> Dataset Manager
        </button>
      </div>

      {feedback && (
        <div className="alert-box alert-success" style={{ marginBottom: '20px' }}>
          <CheckCircle2 size={16} /> {feedback}
        </div>
      )}

      {activeTab === 'take-attendance' && (
        <div className="grid-cols-2" style={{ gap: '20px' }}>
          
          <div className="ui-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Camera size={18} color="var(--accent-primary)" /> Live Attendance Studio
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => { setSelectedSection(e.target.value); setSelectedSubject(''); }}
                  className="select-field"
                >
                  {sections.map(sec => <option key={sec.id} value={sec.id}>{sec.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="select-field"
                >
                  {availableSubjects.map(sub => <option key={sub.id} value={sub.id}>{sub.code} - {sub.name}</option>)}
                </select>
              </div>
            </div>

            <div className="scanner-viewport" style={{ height: '280px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {useWebcam ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  
                  {isLiveSessionRunning && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span className="pulse-dot" />
                      Live Camera Active
                    </div>
                  )}

                  {latestMatchToast && (
                    <div style={{
                      position: 'absolute',
                      bottom: '12px',
                      left: '12px',
                      right: '12px',
                      background: 'rgba(16, 185, 129, 0.95)',
                      color: '#ffffff',
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: 'var(--shadow-md)'
                    }}>
                      <CheckCircle2 size={16} color="#ffffff" />
                      Detected: {latestMatchToast.studentName}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                  {capturedImage ? (
                    <img src={capturedImage} alt="Preview" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                  ) : (
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Upload class photo to scan</p>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                onClick={() => setUseWebcam(!useWebcam)}
                className="btn-secondary"
                disabled={isLiveSessionRunning}
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}
              >
                {useWebcam ? 'Use Photo Upload' : 'Use Webcam'}
              </button>

              {!useWebcam && (
                <label className="btn-secondary" style={{ flex: 1, justifyContent: 'center', cursor: 'pointer', fontSize: '0.8rem' }}>
                  Select File
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            {useWebcam ? (
              isLiveSessionRunning ? (
                <button
                  onClick={stopAndFinalizeSession}
                  className="btn-danger"
                  disabled={isScanning}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {isScanning ? <RefreshCw size={16} className="animate-spin" /> : <XCircle size={16} />}
                  End Session & Finalize Roster
                </button>
              ) : (
                <button
                  onClick={startLiveSession}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Play size={16} />
                  Start Live Attendance
                </button>
              )
            ) : (
              <button
                onClick={handleProcessAttendance}
                className="btn-primary"
                disabled={isScanning}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {isScanning ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                {isScanning ? 'Processing...' : 'Process Image Attendance'}
              </button>
            )}

            {isLiveSessionRunning && (
              <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    Recognized Students ({recognizedPresentStudents.length}):
                  </span>
                </div>
                {recognizedPresentStudents.length === 0 ? (
                  <p style={{ fontSize: '0.775rem', color: 'var(--text-tertiary)' }}>No students detected yet...</p>
                ) : (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {recognizedPresentStudents.map(st => (
                      <span key={st.studentId} className="badge badge-present" style={{ fontSize: '0.75rem' }}>
                        <CheckCircle2 size={12} /> {st.studentName}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {scannerError && (
              <div className="alert-box alert-error" style={{ marginTop: '14px' }}>
                <AlertCircle size={15} /> {scannerError}
              </div>
            )}

          </div>

          <div className="ui-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--accent-primary)" /> Session Summary
            </h3>

            {attendanceResult ? (
              <div>
                <div style={{ padding: '12px', background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Recorded for <strong>{attendanceResult.section} — {attendanceResult.subject}</strong> on {attendanceResult.date} at {attendanceResult.time}
                  </p>
                  
                  {attendanceResult.recognizedMatches?.length > 0 && (
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase' }}>
                        Embeddings Detected:
                      </span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {attendanceResult.recognizedMatches.map((m, idx) => (
                          <span key={idx} className="badge badge-primary">
                            {m.name} ({m.distance})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '10px' }}>Roster Attendance:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
                  {attendanceResult.records.map((rec) => (
                    <div
                      key={rec.studentId}
                      style={{
                        display: 'flex',
                        justify: 'space-between',
                        alignItems: 'center',
                        padding: '9px 12px',
                        background: 'var(--bg-app)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <span style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{rec.studentName}</span>
                      <span className={rec.status === 'PRESENT' ? 'badge badge-present' : 'badge badge-absent'}>
                        {rec.status === 'PRESENT' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {rec.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)' }}>
                <Camera size={36} color="var(--border-medium)" style={{ marginBottom: '8px' }} />
                <p style={{ fontSize: '0.85rem' }}>Select Section & Subject and start live attendance to record student roster logs.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {activeTab === 'classes-enrollment' && (
        <div className="grid-cols-2" style={{ gap: '20px' }}>
          
          <div className="ui-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px' }}>1. Add New Section</h3>
            <form onSubmit={handleAddSection} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <input
                type="text"
                required
                placeholder="e.g. Section C"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                className="input-field"
              />
              <button type="submit" className="btn-primary" style={{ shrink: 0 }}>Add Section</button>
            </form>

            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px' }}>2. Create Subject</h3>
            <form onSubmit={handleAddSubject} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Assigned Section</label>
                <select
                  value={newSubjectSectionId}
                  onChange={(e) => setNewSubjectSectionId(e.target.value)}
                  className="select-field"
                >
                  {sections.map(sec => <option key={sec.id} value={sec.id}>{sec.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Subject Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS404"
                  value={newSubjectCode}
                  onChange={(e) => setNewSubjectCode(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Subject Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Mining"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="input-field"
                />
              </div>
              <button type="submit" className="btn-primary">Create Subject</button>
            </form>
          </div>

          <div className="ui-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px' }}>3. Enroll Student to Course</h3>
            <form onSubmit={handleEnroll} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Student</label>
                <select
                  value={enrollStudentId}
                  onChange={(e) => setEnrollStudentId(e.target.value)}
                  className="select-field"
                >
                  <option value="">-- Select Student --</option>
                  {allStudents.map(stu => <option key={stu.id} value={stu.id}>{stu.full_name} ({stu.email})</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Section</label>
                <select
                  value={enrollSectionId}
                  onChange={(e) => setEnrollSectionId(e.target.value)}
                  className="select-field"
                >
                  {sections.map(sec => <option key={sec.id} value={sec.id}>{sec.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Subject</label>
                <select
                  value={enrollSubjectId}
                  onChange={(e) => setEnrollSubjectId(e.target.value)}
                  className="select-field"
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.filter(s => s.section_id.toString() === enrollSectionId.toString()).map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.code} - {sub.name}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
                Enroll Student
              </button>
            </form>
          </div>

        </div>
      )}

      {activeTab === 'dataset-manager' && (
        <div className="ui-card" style={{ padding: '24px', maxWidth: '540px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={18} color="var(--accent-primary)" /> Face Dataset Uploader
          </h3>

          <form onSubmit={handleRegisterDataset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Student Dataset Folder Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Siva, Harsha, Hrishi"
                value={datasetStudentName}
                onChange={(e) => setDatasetStudentName(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Face Image File
              </label>
              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setDatasetImage(reader.result);
                    reader.readAsDataURL(file);
                  }
                }}
                className="input-field"
              />
            </div>

            {datasetImage && (
              <div style={{ textAlign: 'center', background: 'var(--bg-app)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <img src={datasetImage} alt="Preview" style={{ height: '120px', borderRadius: 'var(--radius-sm)' }} />
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>
              Upload Image & Update Embeddings
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
