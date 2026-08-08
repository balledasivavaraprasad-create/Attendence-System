import os
import cv2
import base64
import pickle
import numpy as np
import subprocess
import sqlite3
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from werkzeug.security import generate_password_hash, check_password_hash
from deepface import DeepFace
from database import get_db_connection, init_db
from attendence import mark_attendance as mark_csv_attendance

app = FastAPI(title="Smart Attendance System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

EMBEDDING_FILE = "embeddings/embeddings.pkl"
YUNET_MODEL_PATH = "models/face_detection_yunet_2023mar.onnx"
COSINE_DISTANCE_THRESHOLD = 0.55

CACHED_NORM_DB = {}

def get_normalized_database():
    global CACHED_NORM_DB
    if not CACHED_NORM_DB and os.path.exists(EMBEDDING_FILE):
        try:
            with open(EMBEDDING_FILE, "rb") as f:
                raw_db = pickle.load(f)
            norm_db = {}
            for person_name, embeddings in raw_db.items():
                valid_vectors = []
                for emb in embeddings:
                    vec = np.array(emb, dtype=np.float32)
                    n = np.linalg.norm(vec)
                    if n > 0:
                        valid_vectors.append(vec / n)
                if valid_vectors:
                    norm_db[person_name] = np.vstack(valid_vectors)
            CACHED_NORM_DB = norm_db
        except Exception:
            pass
    return CACHED_NORM_DB

def reload_embeddings_cache():
    global CACHED_NORM_DB
    CACHED_NORM_DB = {}
    return get_normalized_database()

init_db()
get_normalized_database()

detector = None
if os.path.exists(YUNET_MODEL_PATH):
    try:
        detector = cv2.FaceDetectorYN.create(
            YUNET_MODEL_PATH,
            "",
            (320, 320),
            0.6,
            0.3,
            5000
        )
    except Exception:
        pass

def recognize_faces_in_frame(image_b64: str):
    if not image_b64:
        return []
    
    matches = []
    try:
        if "," in image_b64:
            image_b64 = image_b64.split(",")[1]
        img_bytes = base64.b64decode(image_b64)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        norm_db = get_normalized_database()

        if frame is not None and norm_db:
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            h, w = frame.shape[:2]

            faces_to_process = []

            if detector:
                try:
                    small_frame = cv2.resize(frame, (320, 320))
                    detector.setInputSize((320, 320))
                    _, faces = detector.detect(small_frame)
                    if faces is not None and len(faces) > 0:
                        scale_x = w / 320.0
                        scale_y = h / 320.0
                        for face in faces:
                            fx, fy, fw, fh = face[:4]
                            fx = int(max(0, fx * scale_x))
                            fy = int(max(0, fy * scale_y))
                            fw = int(min(w - fx, fw * scale_x))
                            fh = int(min(h - fy, fh * scale_y))
                            if fw > 15 and fh > 15:
                                crop = frame_rgb[fy:fy+fh, fx:fx+fw]
                                faces_to_process.append(cv2.resize(crop, (112, 112)))
                except Exception:
                    pass

            if not faces_to_process:
                faces_to_process = [cv2.resize(frame_rgb, (112, 112))]

            for face_img in faces_to_process:
                try:
                    reps = DeepFace.represent(
                        img_path=face_img,
                        model_name="ArcFace",
                        enforce_detection=False,
                        detector_backend="skip"
                    )
                    for r in reps:
                        emb = np.array(r["embedding"], dtype=np.float32)
                        norm_val = np.linalg.norm(emb)
                        if norm_val == 0:
                            continue
                        u = emb / norm_val

                        best_person = "Unknown"
                        best_distance = 1.0

                        for person_name, matrix in norm_db.items():
                            sims = np.dot(matrix, u)
                            max_sim = np.max(sims)
                            cos_dist = float(1.0 - max_sim)
                            if cos_dist < best_distance:
                                best_distance = cos_dist
                                best_person = person_name

                        if best_distance <= COSINE_DISTANCE_THRESHOLD and best_person != "Unknown":
                            matches.append({"name": best_person, "distance": round(float(best_distance), 4)})
                except Exception:
                    pass
    except Exception:
        pass
    
    return matches

class RegisterSchema(BaseModel):
    email: str
    password: str
    fullName: str
    role: Optional[str] = "student"
    studentDatasetName: Optional[str] = None

class LoginSchema(BaseModel):
    email: str
    password: str

class SectionSchema(BaseModel):
    name: str
    teacherId: Optional[int] = 1

class SubjectSchema(BaseModel):
    code: str
    name: str
    sectionId: int
    teacherId: Optional[int] = 1

class EnrollSchema(BaseModel):
    studentId: int
    sectionId: int
    subjectId: int

class RecognizeFrameSchema(BaseModel):
    image: str
    sectionId: int
    subjectId: int

class FinalizeAttendanceSchema(BaseModel):
    sectionId: int
    subjectId: int
    teacherId: Optional[int] = 1
    presentStudentIds: List[int] = []

class TakeAttendanceSchema(BaseModel):
    sectionId: int
    subjectId: int
    image: Optional[str] = None
    teacherId: Optional[int] = 1

class RegisterFaceSchema(BaseModel):
    datasetName: str
    image: str

@app.post("/api/auth/register", status_code=201)
def register(data: RegisterSchema):
    email = data.email.strip().lower()
    password = data.password
    full_name = data.fullName.strip()
    role = (data.role or "student").strip().lower()
    dataset_name = (data.studentDatasetName or "").strip() or full_name

    if not email or not password or not full_name:
        raise HTTPException(status_code=400, detail="Email, password, and full name are required.")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    pass_hash = generate_password_hash(password)
    cursor.execute("""
        INSERT INTO users (email, password_hash, full_name, role, student_dataset_name)
        VALUES (?, ?, ?, ?, ?)
    """, (email, pass_hash, full_name, role, dataset_name if role == "student" else None))
    conn.commit()

    user_id = cursor.lastrowid
    conn.close()

    return {
        "message": "Account created successfully!",
        "user": {
            "id": user_id,
            "email": email,
            "fullName": full_name,
            "role": role,
            "studentDatasetName": dataset_name if role == "student" else None
        }
    }

@app.post("/api/auth/login")
def login(data: LoginSchema):
    email = data.email.strip().lower()
    password = data.password

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required.")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()

    if not user or not check_password_hash(user["password_hash"], password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    return {
        "message": "Logged in successfully!",
        "token": f"token_user_{user['id']}",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "fullName": user["full_name"],
            "role": user["role"],
            "studentDatasetName": user["student_dataset_name"]
        }
    }

@app.get("/api/teacher/sections")
def get_sections():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sections ORDER BY name ASC")
    sections = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return sections

@app.post("/api/teacher/sections", status_code=201)
def create_section(data: SectionSchema):
    name = data.name.strip()
    teacher_id = data.teacherId or 1

    if not name:
        raise HTTPException(status_code=400, detail="Section name is required.")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO sections (name, teacher_id) VALUES (?, ?)", (name, teacher_id))
    conn.commit()
    section_id = cursor.lastrowid
    conn.close()
    return {"id": section_id, "name": name}

@app.get("/api/teacher/subjects")
def get_subjects(sectionId: Optional[int] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if sectionId:
        cursor.execute("SELECT * FROM subjects WHERE section_id = ? ORDER BY name ASC", (sectionId,))
    else:
        cursor.execute("""
            SELECT s.*, sec.name as section_name 
            FROM subjects s 
            JOIN sections sec ON s.section_id = sec.id 
            ORDER BY s.name ASC
        """)
    subjects = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return subjects

@app.post("/api/teacher/subjects", status_code=201)
def create_subject(data: SubjectSchema):
    code = data.code.strip()
    name = data.name.strip()
    section_id = data.sectionId
    teacher_id = data.teacherId or 1

    if not name or not section_id or not code:
        raise HTTPException(status_code=400, detail="Code, name, and sectionId are required.")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO subjects (code, name, section_id, teacher_id)
        VALUES (?, ?, ?, ?)
    """, (code, name, section_id, teacher_id))
    conn.commit()
    subject_id = cursor.lastrowid
    conn.close()
    return {"id": subject_id, "code": code, "name": name, "sectionId": section_id}

@app.get("/api/teacher/students")
def list_students():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, full_name, student_dataset_name FROM users WHERE role = 'student' ORDER BY full_name ASC")
    students = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return students

@app.post("/api/teacher/enroll", status_code=201)
def enroll_student(data: EnrollSchema):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO enrollments (student_id, section_id, subject_id)
            VALUES (?, ?, ?)
        """, (data.studentId, data.sectionId, data.subjectId))
        conn.commit()
        conn.close()
        return {"message": "Student successfully enrolled in subject."}
    except sqlite3.IntegrityError:
        conn.close()
        return {"message": "Student is already enrolled in this subject."}

@app.get("/api/teacher/section-students/{section_id}/{subject_id}")
def get_enrolled_students(section_id: int, subject_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.id, u.full_name, u.email, u.student_dataset_name
        FROM users u
        JOIN enrollments e ON u.id = e.student_id
        WHERE e.section_id = ? AND e.subject_id = ?
    """, (section_id, subject_id))
    students = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return students

@app.post("/api/teacher/recognize-frame")
def recognize_frame(data: RecognizeFrameSchema):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.id, u.full_name, u.student_dataset_name
        FROM users u
        JOIN enrollments e ON u.id = e.student_id
        WHERE e.section_id = ? AND e.subject_id = ?
    """, (data.sectionId, data.subjectId))
    enrolled_students = [dict(row) for row in cursor.fetchall()]
    conn.close()

    matches = recognize_faces_in_frame(data.image)
    recognized_students = []

    for match in matches:
        m_name = match["name"].lower()
        for student in enrolled_students:
            s_name = student["full_name"]
            s_dataset_name = (student["student_dataset_name"] or s_name).lower()

            if m_name == s_dataset_name or m_name in s_name.lower() or s_name.lower() in m_name:
                if not any(rs["studentId"] == student["id"] for rs in recognized_students):
                    recognized_students.append({
                        "studentId": student["id"],
                        "studentName": student["full_name"],
                        "datasetName": match["name"],
                        "distance": match["distance"]
                    })

    return {
        "recognizedStudents": recognized_students,
        "rawMatches": matches
    }

@app.post("/api/teacher/finalize-attendance", status_code=201)
def finalize_attendance(data: FinalizeAttendanceSchema):
    present_student_ids = set(data.presentStudentIds)

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM sections WHERE id = ?", (data.sectionId,))
    section_row = cursor.fetchone()
    cursor.execute("SELECT name FROM subjects WHERE id = ?", (data.subjectId,))
    subject_row = cursor.fetchone()

    section_name = section_row["name"] if section_row else "Section"
    subject_name = subject_row["name"] if subject_row else "Subject"

    cursor.execute("""
        SELECT u.id, u.full_name, u.student_dataset_name
        FROM users u
        JOIN enrollments e ON u.id = e.student_id
        WHERE e.section_id = ? AND e.subject_id = ?
    """, (data.sectionId, data.subjectId))
    enrolled_students = [dict(row) for row in cursor.fetchall()]

    if not enrolled_students:
        conn.close()
        raise HTTPException(status_code=400, detail="No students enrolled in this section and subject.")

    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M:%S")

    cursor.execute("""
        INSERT INTO attendance_sessions (section_id, subject_id, teacher_id, date, time, mode)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (data.sectionId, data.subjectId, data.teacherId or 1, date_str, time_str, "Camera"))
    session_id = cursor.lastrowid

    session_summary = []

    for student in enrolled_students:
        s_id = student["id"]
        s_name = student["full_name"]

        is_present = s_id in present_student_ids
        status = "PRESENT" if is_present else "ABSENT"

        cursor.execute("""
            INSERT INTO attendance_records (session_id, student_id, status, confidence, timestamp)
            VALUES (?, ?, ?, ?, ?)
        """, (session_id, s_id, status, 0.95 if is_present else 0.0, f"{date_str} {time_str}"))

        if is_present:
            mark_csv_attendance(s_name, section_name=section_name, subject_name=subject_name)

        session_summary.append({
            "studentId": s_id,
            "studentName": s_name,
            "status": status
        })

    conn.commit()
    conn.close()

    return {
        "message": "Attendance session successfully finalized & logged!",
        "sessionId": session_id,
        "date": date_str,
        "time": time_str,
        "section": section_name,
        "subject": subject_name,
        "totalPresent": len([r for r in session_summary if r["status"] == "PRESENT"]),
        "totalAbsent": len([r for r in session_summary if r["status"] == "ABSENT"]),
        "records": session_summary
    }

@app.post("/api/teacher/take-attendance", status_code=201)
def take_attendance(data: TakeAttendanceSchema):
    matches = recognize_faces_in_frame(data.image) if data.image else []
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.id, u.full_name, u.student_dataset_name
        FROM users u
        JOIN enrollments e ON u.id = e.student_id
        WHERE e.section_id = ? AND e.subject_id = ?
    """, (data.sectionId, data.subjectId))
    enrolled_students = [dict(row) for row in cursor.fetchall()]
    
    cursor.execute("SELECT name FROM sections WHERE id = ?", (data.sectionId,))
    sec_r = cursor.fetchone()
    cursor.execute("SELECT name FROM subjects WHERE id = ?", (data.subjectId,))
    sub_r = cursor.fetchone()
    section_name = sec_r["name"] if sec_r else "Section"
    subject_name = sub_r["name"] if sub_r else "Subject"

    present_ids = set()
    matches_info = []
    for match in matches:
        m_name = match["name"].lower()
        for student in enrolled_students:
            s_name = student["full_name"]
            s_dataset_name = (student["student_dataset_name"] or s_name).lower()
            if m_name == s_dataset_name or m_name in s_name.lower() or s_name.lower() in m_name:
                present_ids.add(student["id"])
                matches_info.append({"name": student["full_name"], "distance": match["distance"]})

    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M:%S")

    cursor.execute("""
        INSERT INTO attendance_sessions (section_id, subject_id, teacher_id, date, time, mode)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (data.sectionId, data.subjectId, data.teacherId or 1, date_str, time_str, "Camera" if data.image else "Manual"))
    session_id = cursor.lastrowid

    session_summary = []
    for student in enrolled_students:
        s_id = student["id"]
        s_name = student["full_name"]
        is_present = s_id in present_ids
        status = "PRESENT" if is_present else "ABSENT"

        cursor.execute("""
            INSERT INTO attendance_records (session_id, student_id, status, confidence, timestamp)
            VALUES (?, ?, ?, ?, ?)
        """, (session_id, s_id, status, 0.95 if is_present else 0.0, f"{date_str} {time_str}"))

        if is_present:
            mark_csv_attendance(s_name, section_name=section_name, subject_name=subject_name)

        session_summary.append({
            "studentId": s_id,
            "studentName": s_name,
            "status": status
        })

    conn.commit()
    conn.close()

    return {
        "message": "Attendance session successfully recorded!",
        "sessionId": session_id,
        "date": date_str,
        "time": time_str,
        "section": section_name,
        "subject": subject_name,
        "recognizedMatches": matches_info,
        "records": session_summary
    }

@app.post("/api/teacher/register-student-face")
def register_student_face(data: RegisterFaceSchema):
    student_dataset_name = data.datasetName.strip()
    image_b64 = data.image

    if not student_dataset_name or not image_b64:
        raise HTTPException(status_code=400, detail="datasetName and image are required.")

    folder_path = os.path.join("dataset", student_dataset_name)
    os.makedirs(folder_path, exist_ok=True)

    existing_count = len(os.listdir(folder_path))
    file_path = os.path.join(folder_path, f"{existing_count + 1}.jpg")

    try:
        if "," in image_b64:
            image_b64 = image_b64.split(",")[1]
        img_bytes = base64.b64decode(image_b64)
        with open(file_path, "wb") as f:
            f.write(img_bytes)

        subprocess.Popen(["python3", "generate_embeddings.py"])
        reload_embeddings_cache()

        return {
            "message": f"Face saved for {student_dataset_name}. Embedding update triggered!",
            "filePath": file_path,
            "totalImages": existing_count + 1
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/student/dashboard/{student_id}")
def get_student_dashboard(student_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, full_name, email, student_dataset_name FROM users WHERE id = ?", (student_id,))
    student = cursor.fetchone()

    if not student:
        conn.close()
        raise HTTPException(status_code=404, detail="Student not found.")

    cursor.execute("""
        SELECT s.id as subject_id, s.code as subject_code, s.name as subject_name,
               sec.id as section_id, sec.name as section_name
        FROM enrollments e
        JOIN subjects s ON e.subject_id = s.id
        JOIN sections sec ON e.section_id = sec.id
        WHERE e.student_id = ?
    """, (student_id,))
    enrollments = cursor.fetchall()

    subject_stats = []
    total_conducted_all = 0
    total_attended_all = 0

    for enr in enrollments:
        sub_id = enr["subject_id"]
        sec_id = enr["section_id"]

        cursor.execute("""
            SELECT COUNT(*) FROM attendance_sessions
            WHERE section_id = ? AND subject_id = ?
        """, (sec_id, sub_id))
        total_sessions = cursor.fetchone()[0]

        cursor.execute("""
            SELECT COUNT(*) FROM attendance_records ar
            JOIN attendance_sessions os ON ar.session_id = os.id
            WHERE ar.student_id = ? AND os.section_id = ? AND os.subject_id = ? AND ar.status = 'PRESENT'
        """, (student_id, sec_id, sub_id))
        attended_sessions = cursor.fetchone()[0]

        percentage = round((attended_sessions / total_sessions * 100), 1) if total_sessions > 0 else 0.0

        total_conducted_all += total_sessions
        total_attended_all += attended_sessions

        subject_stats.append({
            "subjectId": sub_id,
            "subjectCode": enr["subject_code"],
            "subjectName": enr["subject_name"],
            "sectionId": sec_id,
            "sectionName": enr["section_name"],
            "totalSessions": total_sessions,
            "attendedSessions": attended_sessions,
            "percentage": percentage
        })

    overall_percentage = round((total_attended_all / total_conducted_all * 100), 1) if total_conducted_all > 0 else 0.0

    conn.close()

    return {
        "student": dict(student),
        "overallPercentage": overall_percentage,
        "totalConducted": total_conducted_all,
        "totalAttended": total_attended_all,
        "subjectStats": subject_stats
    }

@app.get("/api/student/attendance/{student_id}")
def get_student_attendance_history(student_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT ar.id, ar.status, ar.confidence, ar.timestamp,
               sess.date, sess.time, sess.mode,
               s.code as subject_code, s.name as subject_name,
               sec.name as section_name
        FROM attendance_records ar
        JOIN attendance_sessions sess ON ar.session_id = sess.id
        JOIN subjects s ON sess.subject_id = s.id
        JOIN sections sec ON sess.section_id = sec.id
        WHERE ar.student_id = ?
        ORDER BY sess.date DESC, sess.time DESC
    """, (student_id,))

    logs = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return logs

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=5001, reload=True)
