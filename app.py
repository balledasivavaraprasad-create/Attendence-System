import os
import cv2
import base64
import pickle
import numpy as np
import subprocess
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from deepface import DeepFace
from database import get_db_connection, init_db
from attendence import mark_attendance as mark_csv_attendance

app = Flask(__name__)
CORS(app)

EMBEDDING_FILE = "embeddings/embeddings.pkl"
YUNET_MODEL_PATH = "models/face_detection_yunet_2023mar.onnx"
FACE_MATCH_THRESHOLD = 5.0

init_db()

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
        print("YuNet Face Detector initialized.")
    except Exception as e:
        print("Warning: Could not initialize YuNet detector:", e)

def load_embeddings():
    if os.path.exists(EMBEDDING_FILE):
        try:
            with open(EMBEDDING_FILE, "rb") as f:
                return pickle.load(f)
        except Exception as e:
            print("Error loading embeddings:", e)
    return {}

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    full_name = data.get("fullName", "").strip()
    role = data.get("role", "student").strip().lower()
    dataset_name = data.get("studentDatasetName", "").strip() or full_name

    if not email or not password or not full_name:
        return jsonify({"error": "Email, password, and full name are required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        return jsonify({"error": "An account with this email already exists."}), 400

    pass_hash = generate_password_hash(password)
    cursor.execute("""
        INSERT INTO users (email, password_hash, full_name, role, student_dataset_name)
        VALUES (?, ?, ?, ?, ?)
    """, (email, pass_hash, full_name, role, dataset_name if role == "student" else None))
    conn.commit()

    user_id = cursor.lastrowid
    conn.close()

    return jsonify({
        "message": "Account created successfully!",
        "user": {
            "id": user_id,
            "email": email,
            "fullName": full_name,
            "role": role,
            "studentDatasetName": dataset_name if role == "student" else None
        }
    }), 201

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid email or password."}), 401

    return jsonify({
        "message": "Logged in successfully!",
        "token": f"token_user_{user['id']}",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "fullName": user["full_name"],
            "role": user["role"],
            "studentDatasetName": user["student_dataset_name"]
        }
    })

@app.route("/api/teacher/sections", methods=["GET", "POST"])
def manage_sections():
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == "POST":
        data = request.json or {}
        name = data.get("name", "").strip()
        teacher_id = data.get("teacherId", 1)

        if not name:
            conn.close()
            return jsonify({"error": "Section name is required."}), 400

        cursor.execute("INSERT INTO sections (name, teacher_id) VALUES (?, ?)", (name, teacher_id))
        conn.commit()
        section_id = cursor.lastrowid
        conn.close()
        return jsonify({"id": section_id, "name": name}), 201

    cursor.execute("SELECT * FROM sections ORDER BY name ASC")
    sections = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(sections)

@app.route("/api/teacher/subjects", methods=["GET", "POST"])
def manage_subjects():
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == "POST":
        data = request.json or {}
        code = data.get("code", "").strip()
        name = data.get("name", "").strip()
        section_id = data.get("sectionId")
        teacher_id = data.get("teacherId", 1)

        if not name or not section_id or not code:
            conn.close()
            return jsonify({"error": "Code, name, and sectionId are required."}), 400

        cursor.execute("""
            INSERT INTO subjects (code, name, section_id, teacher_id)
            VALUES (?, ?, ?, ?)
        """, (code, name, section_id, teacher_id))
        conn.commit()
        subject_id = cursor.lastrowid
        conn.close()
        return jsonify({"id": subject_id, "code": code, "name": name, "sectionId": section_id}), 201

    section_id = request.args.get("sectionId")
    if section_id:
        cursor.execute("SELECT * FROM subjects WHERE section_id = ? ORDER BY name ASC", (section_id,))
    else:
        cursor.execute("""
            SELECT s.*, sec.name as section_name 
            FROM subjects s 
            JOIN sections sec ON s.section_id = sec.id 
            ORDER BY s.name ASC
        """)
    subjects = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(subjects)

@app.route("/api/teacher/students", methods=["GET"])
def list_students():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, full_name, student_dataset_name FROM users WHERE role = 'student' ORDER BY full_name ASC")
    students = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(students)

@app.route("/api/teacher/enroll", methods=["POST"])
def enroll_student():
    data = request.json or {}
    student_id = data.get("studentId")
    section_id = data.get("sectionId")
    subject_id = data.get("subjectId")

    if not student_id or not section_id or not subject_id:
        return jsonify({"error": "studentId, sectionId, and subjectId are required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO enrollments (student_id, section_id, subject_id)
            VALUES (?, ?, ?)
        """, (student_id, section_id, subject_id))
        conn.commit()
        conn.close()
        return jsonify({"message": "Student successfully enrolled in subject."}), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"message": "Student is already enrolled in this subject."}), 200

@app.route("/api/teacher/section-students/<int:section_id>/<int:subject_id>", methods=["GET"])
def get_enrolled_students(section_id, subject_id):
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
    return jsonify(students)

@app.route("/api/teacher/take-attendance", methods=["POST"])
def take_attendance():
    data = request.json or {}
    image_b64 = data.get("image")
    section_id = data.get("sectionId")
    subject_id = data.get("subjectId")
    teacher_id = data.get("teacherId", 1)

    if not section_id or not subject_id:
        return jsonify({"error": "sectionId and subjectId are required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM sections WHERE id = ?", (section_id,))
    section_row = cursor.fetchone()
    cursor.execute("SELECT name FROM subjects WHERE id = ?", (subject_id,))
    subject_row = cursor.fetchone()

    section_name = section_row["name"] if section_row else "Section"
    subject_name = subject_row["name"] if subject_row else "Subject"

    cursor.execute("""
        SELECT u.id, u.full_name, u.student_dataset_name
        FROM users u
        JOIN enrollments e ON u.id = e.student_id
        WHERE e.section_id = ? AND e.subject_id = ?
    """, (section_id, subject_id))
    enrolled_students = [dict(row) for row in cursor.fetchall()]
    conn.close()

    if not enrolled_students:
        return jsonify({"error": "No students are enrolled in this section and subject list."}), 400

    matched_names = set()
    matches_info = []

    if image_b64:
        try:
            if "," in image_b64:
                image_b64 = image_b64.split(",")[1]
            img_bytes = base64.b64decode(image_b64)
            nparr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            database = load_embeddings()

            if frame is not None and database:
                h, w = frame.shape[:2]
                if detector:
                    detector.setInputSize((w, h))
                    _, faces = detector.detect(frame)
                else:
                    faces = None

                if faces is None or len(faces) == 0:
                    try:
                        embedding = DeepFace.represent(
                            img_path=frame,
                            model_name="ArcFace",
                            enforce_detection=False
                        )[0]["embedding"]

                        best_person = "Unknown"
                        best_distance = float("inf")
                        for person_name, embeddings in database.items():
                            for stored_embedding in embeddings:
                                dist = np.linalg.norm(np.array(embedding) - np.array(stored_embedding))
                                if dist < best_distance:
                                    best_distance = dist
                                    best_person = person_name

                        if best_distance <= FACE_MATCH_THRESHOLD and best_person != "Unknown":
                            matched_names.add(best_person.lower())
                            matches_info.append({"name": best_person, "distance": round(best_distance, 2)})
                    except Exception as ex:
                        print("Direct frame face representation error:", ex)
                else:
                    for face in faces:
                        x, y, fw, fh = face[:4].astype(int)
                        x, y = max(0, x), max(0, y)
                        face_crop = frame[y:y+fh, x:x+fw]
                        if face_crop.size == 0:
                            continue
                        face_crop_rgb = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)
                        try:
                            embedding = DeepFace.represent(
                                img_path=face_crop_rgb,
                                model_name="ArcFace",
                                enforce_detection=False
                            )[0]["embedding"]

                            best_person = "Unknown"
                            best_distance = float("inf")
                            for person_name, embeddings in database.items():
                                for stored_embedding in embeddings:
                                    dist = np.linalg.norm(np.array(embedding) - np.array(stored_embedding))
                                    if dist < best_distance:
                                        best_distance = dist
                                        best_person = person_name

                            if best_distance <= FACE_MATCH_THRESHOLD and best_person != "Unknown":
                                matched_names.add(best_person.lower())
                                matches_info.append({"name": best_person, "distance": round(best_distance, 2)})
                        except Exception as ex:
                            print("Face crop representation error:", ex)

        except Exception as e:
            print("Error processing frame for recognition:", e)

    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M:%S")

    conn = get_db_connection()
    cursor.execute("""
        INSERT INTO attendance_sessions (section_id, subject_id, teacher_id, date, time, mode)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (section_id, subject_id, teacher_id, date_str, time_str, "Camera" if image_b64 else "Manual"))
    session_id = cursor.lastrowid

    session_summary = []

    for student in enrolled_students:
        s_id = student["id"]
        s_name = student["full_name"]
        s_dataset_name = (student["student_dataset_name"] or s_name).lower()

        is_present = (s_dataset_name in matched_names) or (s_name.lower() in matched_names)
        status = "PRESENT" if is_present else "ABSENT"

        cursor.execute("""
            INSERT INTO attendance_records (session_id, student_id, status, confidence, timestamp)
            VALUES (?, ?, ?, ?, ?)
        """, (session_id, s_id, status, 0.90 if is_present else 0.0, f"{date_str} {time_str}"))

        if is_present:
            mark_csv_attendance(student["full_name"], section_name=section_name, subject_name=subject_name)

        session_summary.append({
            "studentId": s_id,
            "studentName": s_name,
            "status": status
        })

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Attendance session successfully recorded!",
        "sessionId": session_id,
        "date": date_str,
        "time": time_str,
        "section": section_name,
        "subject": subject_name,
        "recognizedMatches": matches_info,
        "records": session_summary
    }), 201

@app.route("/api/teacher/register-student-face", methods=["POST"])
def register_student_face():
    data = request.json or {}
    student_dataset_name = data.get("datasetName", "").strip()
    image_b64 = data.get("image")

    if not student_dataset_name or not image_b64:
        return jsonify({"error": "datasetName and image are required."}), 400

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

        return jsonify({
            "message": f"Face saved for {student_dataset_name}. Embedding update triggered!",
            "filePath": file_path,
            "totalImages": existing_count + 1
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/student/dashboard/<int:student_id>", methods=["GET"])
def get_student_dashboard(student_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, full_name, email, student_dataset_name FROM users WHERE id = ?", (student_id,))
    student = cursor.fetchone()

    if not student:
        conn.close()
        return jsonify({"error": "Student not found."}), 404

    if not student:
        conn.close()
        return jsonify({"error": "Student not found."}), 404

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

    return jsonify({
        "student": dict(student),
        "overallPercentage": overall_percentage,
        "totalConducted": total_conducted_all,
        "totalAttended": total_attended_all,
        "subjectStats": subject_stats
    })

@app.route("/api/student/attendance/<int:student_id>", methods=["GET"])
def get_student_attendance_history(student_id):
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

    return jsonify(logs)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
