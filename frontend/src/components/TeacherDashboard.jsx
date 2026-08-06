import React, { useState, useEffect, useRef } from 'react';
import { Camera, Users, BookOpen, PlusCircle, CheckCircle2, XCircle, AlertCircle, RefreshCw, Upload, Play, Shield, Layers, FileText } from 'lucide-react';

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
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg');
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
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <Users size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Registered Students</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{allStudents.length}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
            <Layers size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Active Sections</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{sections.length}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <BookOpen size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Subjects</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{subjects.length}</h3>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('take-attendance')}
          className={activeTab === 'take-attendance' ? 'btn-primary' : 'btn-secondary'}
        >
          <Camera size={18} /> Take Attendance
        </button>
        <button
          onClick={() => setActiveTab('classes-enrollment')}
          className={activeTab === 'classes-enrollment' ? 'btn-primary' : 'btn-secondary'}
        >
          <PlusCircle size={18} /> Classes & Enrollments
        </button>
        <button
          onClick={() => setActiveTab('dataset-manager')}
          className={activeTab === 'dataset-manager' ? 'btn-primary' : 'btn-secondary'}
        >
          <Upload size={18} /> Face Dataset Uploader
        </button>
      </div>

      {feedback && (
        <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-sm)', marginBottom: '20px', color: '#6ee7b7' }}>
          {feedback}
        </div>
      )}

      {activeTab === 'take-attendance' && (
        <div className="grid-cols-2" style={{ gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Camera size={20} color="#818cf8" /> Attendance Studio
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Select Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => { setSelectedSection(e.target.value); setSelectedSubject(''); }}
                  className="select-field"
                >
                  {sections.map(sec => <option key={sec.id} value={sec.id}>{sec.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Select Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="select-field"
                >
                  {availableSubjects.map(sub => <option key={sub.id} value={sub.id}>{sub.code} - {sub.name}</option>)}
                </select>
              </div>
            </div>

            <div className="scanner-viewport" style={{ height: '280px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              {useWebcam ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  {isScanning && <div className="scan-line" />}
                </>
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                  {capturedImage ? (
                    <img src={capturedImage} alt="Preview" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Upload class photo to scan</p>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setUseWebcam(!useWebcam)}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {useWebcam ? 'Switch to Upload' : 'Switch to Camera'}
              </button>

              {!useWebcam && (
                <label className="btn-secondary" style={{ flex: 1, justifyContent: 'center', cursor: 'pointer' }}>
                  Choose Image
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            <button
              onClick={handleProcessAttendance}
              className="btn-primary"
              disabled={isScanning}
              style={{ width: '100%', marginTop: '14px', padding: '14px', justifyContent: 'center', fontSize: '1rem' }}
            >
              {isScanning ? <RefreshCw size={20} className="animate-spin" /> : <Play size={20} />}
              {isScanning ? 'Recognizing Faces...' : 'Scan & Log Attendance'}
            </button>

            {scannerError && (
              <div style={{ marginTop: '16px', color: '#fca5a5', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={16} /> {scannerError}
              </div>
            )}

          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} color="#34d399" /> Session Logs & Verification
            </h3>

            {attendanceResult ? (
              <div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Session logged for <strong>{attendanceResult.section} - {attendanceResult.subject}</strong> on {attendanceResult.date} at {attendanceResult.time}
                  </p>
                  
                  {attendanceResult.recognizedMatches?.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: '700', textTransform: 'uppercase' }}>
                        Matched Embeddings:
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

                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px' }}>Student Roster Status:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
                  {attendanceResult.records.map((rec) => (
                    <div
                      key={rec.studentId}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{rec.studentName}</span>
                      <span className={rec.status === 'PRESENT' ? 'badge badge-present' : 'badge badge-absent'}>
                        {rec.status === 'PRESENT' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {rec.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <Camera size={48} color="rgba(255,255,255,0.15)" style={{ marginBottom: '12px' }} />
                <p>Run a scan to log attendance for the selected Section & Subject.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {activeTab === 'classes-enrollment' && (
        <div className="grid-cols-2" style={{ gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>1. Add Section</h3>
            <form onSubmit={handleAddSection} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
              <input
                type="text"
                required
                placeholder="e.g. Section C"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                className="input-field"
              />
              <button type="submit" className="btn-primary">Add Section</button>
            </form>

            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>2. Add Subject to Section</h3>
            <form onSubmit={handleAddSubject} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <select
                value={newSubjectSectionId}
                onChange={(e) => setNewSubjectSectionId(e.target.value)}
                className="select-field"
              >
                {sections.map(sec => <option key={sec.id} value={sec.id}>{sec.name}</option>)}
              </select>
              <input
                type="text"
                required
                placeholder="Subject Code (e.g. CS404)"
                value={newSubjectCode}
                onChange={(e) => setNewSubjectCode(e.target.value)}
                className="input-field"
              />
              <input
                type="text"
                required
                placeholder="Subject Name (e.g. Data Mining)"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                className="input-field"
              />
              <button type="submit" className="btn-primary">Create Subject</button>
            </form>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>3. Enroll Student to Attendance List</h3>
            <form onSubmit={handleEnroll} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Select Student</label>
                <select
                  value={enrollStudentId}
                  onChange={(e) => setEnrollStudentId(e.target.value)}
                  className="select-field"
                >
                  <option value="">-- Choose Student --</option>
                  {allStudents.map(stu => <option key={stu.id} value={stu.id}>{stu.full_name} ({stu.email})</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Select Section</label>
                <select
                  value={enrollSectionId}
                  onChange={(e) => setEnrollSectionId(e.target.value)}
                  className="select-field"
                >
                  {sections.map(sec => <option key={sec.id} value={sec.id}>{sec.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Select Subject</label>
                <select
                  value={enrollSubjectId}
                  onChange={(e) => setEnrollSubjectId(e.target.value)}
                  className="select-field"
                >
                  <option value="">-- Choose Subject --</option>
                  {subjects.filter(s => s.section_id.toString() === enrollSectionId.toString()).map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.code} - {sub.name}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
                Enroll Student in Subject
              </button>
            </form>
          </div>

        </div>
      )}

      {activeTab === 'dataset-manager' && (
        <div className="glass-panel" style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={20} color="#818cf8" /> Upload Student Face to Dataset
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            New images uploaded here will be saved to <code>dataset/&lt;student_name&gt;/</code> and automatically update ArcFace embeddings.
          </p>

          <form onSubmit={handleRegisterDataset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Student Dataset Folder Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Siva, harsha, hrishi"
                value={datasetStudentName}
                onChange={(e) => setDatasetStudentName(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Select Image File</label>
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
              <div style={{ textAlign: 'center' }}>
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
