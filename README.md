# Attendance System using Face Recognition

A facial recognition attendance system built with OpenCV, DeepFace (ArcFace), Flask, and React.

The application allows teachers to take attendance live via webcam or by uploading class images, managing sections, subjects, and student enrollments. Students can log in to view their subject-wise attendance percentages and historical logs. A CLI option is also available for standalone dataset collection and recognition.

## Features

- **Face Recognition**: Detects faces using YuNet (`face_detection_yunet_2023mar.onnx`) and extracts ArcFace embeddings using DeepFace.
- **Web Application**:
  - Flask backend REST API (`app.py`) running on port 5001.
  - React frontend UI (`frontend/`) built with Vite.
  - SQLite database storing users, sections, subjects, enrollments, sessions, and records.
  - Role-based login (Teacher and Student).
- **Teacher Dashboard**:
  - Live webcam attendance taking or image upload.
  - Section and subject creation.
  - Student subject enrollment.
  - Face image dataset uploader with automatic embedding updating.
- **Student Dashboard**:
  - Subject and section-level attendance percentage tracking.
  - Historical attendance log timeline with status filters.
- **CSV & Database Backup**: Logs attendance to SQLite database as well as `Attendence.csv`.

## Project Structure

```
.
├── app.py                   # Flask REST API backend
├── database.py              # SQLite database schema and connection setup
├── seed_db.py               # Populates database with initial demo data
├── main.py                  # Standalone CLI dataset collection script
├── generate_embeddings.py   # Extracts ArcFace embeddings to embeddings/embeddings.pkl
├── recognize.py             # Standalone CLI real-time recognition script
├── attendence.py            # CSV attendance writer utility
├── dataset/                 # Student face images organized by dataset folder name
├── embeddings/              # Pickled embedding file (embeddings.pkl)
├── models/                  # YuNet ONNX face detection model
├── frontend/                # React Vite web interface
│   ├── src/                 # React components and styling
│   └── package.json
└── requirements.txt         # Python package dependencies
```

## Getting Started

### 1. Requirements & Dependencies

Create a virtual environment and install the Python dependencies:

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt deepface flask flask-cors werkzeug
```

In the `frontend` folder, install Node packages:

```bash
cd frontend
npm install
cd ..
```

### 2. Database Initialization

Seed the database with default accounts and demo data:

```bash
python seed_db.py
```

Demo Accounts:
- **Teacher**: `teacher@school.com` / `password123`
- **Student (Siva)**: `siva@school.com` / `password123`
- **Student (Harsha)**: `harsha@school.com` / `password123`
- **Student (Hrishi)**: `hrishi@school.com` / `password123`

### 3. Running the Web Application

Start the Flask backend server:

```bash
python app.py
```
The backend API runs on `http://localhost:5001`.

In a separate terminal, start the React frontend dev server:

```bash
cd frontend
npm run dev
```
Open `http://localhost:5173` (or the URL shown in terminal) in your browser.

---

## Standalone CLI Tools

If you prefer using terminal commands without the web interface:

### 1. Collect Face Dataset
```bash
python main.py
```
Enter the person's dataset folder name when prompted. It captures face images via webcam and saves up to 30 photos in `dataset/<PersonName>/`.

### 2. Generate ArcFace Embeddings
```bash
python generate_embeddings.py
```
Processes images in `dataset/` and generates `embeddings/embeddings.pkl`.

### 3. Live Recognition
```bash
python recognize.py
```
Starts live recognition from webcam and appends timestamped attendance to `Attendence.csv`.
