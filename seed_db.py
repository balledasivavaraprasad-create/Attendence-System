import os
import sqlite3
from werkzeug.security import generate_password_hash
from database import init_db, get_db_connection

def seed_database():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] > 0:
        print("Database already contains data. Skipping seed.")
        conn.close()
        return

    pass_hash = generate_password_hash("password123")

    users_data = [
        ("teacher@school.com", pass_hash, "Dr. Alan Turing", "teacher", None),
        ("siva@school.com", pass_hash, "Balleda Siva Vara Prasad", "student", "Siva"),
        ("harsha@school.com", pass_hash, "Sri Harsha", "student", "harsha"),
        ("hrishi@school.com", pass_hash, "Hrishi Kesh", "student", "hrishi")
    ]

    cursor.executemany("""
        INSERT INTO users (email, password_hash, full_name, role, student_dataset_name)
        VALUES (?, ?, ?, ?, ?)
    """, users_data)

    teacher_id = 1
    siva_id = 2
    harsha_id = 3
    hrishi_id = 4

    cursor.execute("INSERT INTO sections (name, teacher_id) VALUES (?, ?)", ("Section A", teacher_id))
    sec_a_id = cursor.lastrowid

    cursor.execute("INSERT INTO sections (name, teacher_id) VALUES (?, ?)", ("Section B", teacher_id))
    sec_b_id = cursor.lastrowid

    subjects_data = [
        ("CS401", "Computer Vision", sec_a_id, teacher_id),
        ("CS402", "Machine Learning", sec_a_id, teacher_id),
        ("CS403", "Deep Learning", sec_b_id, teacher_id)
    ]

    cursor.executemany("""
        INSERT INTO subjects (code, name, section_id, teacher_id)
        VALUES (?, ?, ?, ?)
    """, subjects_data)

    cv_id = 1
    ml_id = 2
    dl_id = 3

    enrollments_data = [
        (siva_id, sec_a_id, cv_id),
        (siva_id, sec_a_id, ml_id),
        (siva_id, sec_b_id, dl_id),
        (harsha_id, sec_a_id, cv_id),
        (harsha_id, sec_a_id, ml_id),
        (hrishi_id, sec_a_id, cv_id)
    ]

    cursor.executemany("""
        INSERT INTO enrollments (student_id, section_id, subject_id)
        VALUES (?, ?, ?)
    """, enrollments_data)

    past_sessions = [
        (sec_a_id, cv_id, teacher_id, "2026-08-01", "09:00:00", "Camera"),
        (sec_a_id, cv_id, teacher_id, "2026-08-02", "09:00:00", "Camera"),
        (sec_a_id, cv_id, teacher_id, "2026-08-03", "09:00:00", "Camera"),
        (sec_a_id, cv_id, teacher_id, "2026-08-04", "09:00:00", "Camera"),

        (sec_a_id, ml_id, teacher_id, "2026-08-01", "11:00:00", "Camera"),
        (sec_a_id, ml_id, teacher_id, "2026-08-03", "11:00:00", "Camera"),

        (sec_b_id, dl_id, teacher_id, "2026-08-02", "14:00:00", "Camera"),
        (sec_b_id, dl_id, teacher_id, "2026-08-04", "14:00:00", "Camera")
    ]

    for sec_id, subj_id, t_id, date_str, time_str, mode in past_sessions:
        cursor.execute("""
            INSERT INTO attendance_sessions (section_id, subject_id, teacher_id, date, time, mode)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (sec_id, subj_id, t_id, date_str, time_str, mode))
        sess_id = cursor.lastrowid

        if subj_id == cv_id:
            cursor.execute("INSERT INTO attendance_records (session_id, student_id, status, confidence, timestamp) VALUES (?, ?, ?, ?, ?)",
                           (sess_id, siva_id, "PRESENT", 0.92, f"{date_str} {time_str}"))
            harsha_status = "ABSENT" if date_str == "2026-08-03" else "PRESENT"
            cursor.execute("INSERT INTO attendance_records (session_id, student_id, status, confidence, timestamp) VALUES (?, ?, ?, ?, ?)",
                           (sess_id, harsha_id, harsha_status, 0.89 if harsha_status == "PRESENT" else 0.0, f"{date_str} {time_str}"))
            hrishi_status = "PRESENT" if date_str in ["2026-08-01", "2026-08-02"] else "ABSENT"
            cursor.execute("INSERT INTO attendance_records (session_id, student_id, status, confidence, timestamp) VALUES (?, ?, ?, ?, ?)",
                           (sess_id, hrishi_id, hrishi_status, 0.88 if hrishi_status == "PRESENT" else 0.0, f"{date_str} {time_str}"))

        elif subj_id == ml_id:
            cursor.execute("INSERT INTO attendance_records (session_id, student_id, status, confidence, timestamp) VALUES (?, ?, ?, ?, ?)",
                           (sess_id, siva_id, "PRESENT", 0.95, f"{date_str} {time_str}"))
            harsha_status = "PRESENT" if date_str == "2026-08-01" else "ABSENT"
            cursor.execute("INSERT INTO attendance_records (session_id, student_id, status, confidence, timestamp) VALUES (?, ?, ?, ?, ?)",
                           (sess_id, harsha_id, harsha_status, 0.87 if harsha_status == "PRESENT" else 0.0, f"{date_str} {time_str}"))

        elif subj_id == dl_id:
            siva_status = "PRESENT" if date_str == "2026-08-02" else "ABSENT"
            cursor.execute("INSERT INTO attendance_records (session_id, student_id, status, confidence, timestamp) VALUES (?, ?, ?, ?, ?)",
                           (sess_id, siva_id, siva_status, 0.91 if siva_status == "PRESENT" else 0.0, f"{date_str} {time_str}"))

    conn.commit()
    conn.close()
    print("Database successfully seeded with demo accounts and initial attendance logs.")

if __name__ == "__main__":
    seed_database()
