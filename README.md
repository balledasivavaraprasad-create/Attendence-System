# Smart Attendance System using Face Recognition

A modern, full-stack facial recognition attendance management system built with **FastAPI**, **DeepFace (ArcFace)**, **OpenCV (YuNet)**, and **React (Vite)**.

---

## 📹 Project Demo & Video Preview

> **Watch the Live Attendance Demo**  
> *(Place your `demo.mp4` or `demo.gif` file in the `assets/` folder)*

```html
<div align="center">
  <img src="assets/demo.gif" alt="Smart Attendance System Demo" width="100%" />
</div>
```

---

## 🌟 Key Features

- **Facial Recognition Engine**:
  - Face detection powered by YuNet (`face_detection_yunet_2023mar.onnx`).
  - High-accuracy face embeddings extracted via DeepFace (ArcFace model).
  - Cosine distance matching with threshold tuning for accurate student identification.

- **FastAPI REST Backend**:
  - High-performance asynchronous REST API (`app.py`) running on `http://localhost:5001`.
  - Continuous real-time frame processing endpoint (`/api/teacher/recognize-frame`).
  - Automated SQLite database persistence with CSV backup (`Attendence.csv`).

- **Human-Designed Modern UI**:
  - Built with React & Vite featuring a sleek, professional dark SaaS aesthetic.
  - Role-based authentication (Teacher & Student portals).
  - **Teacher Dashboard**: Live camera attendance studio, real-time detection toasts, section/subject manager, student course enrollment, and dataset photo uploader.
  - **Student Dashboard**: Overall attendance percentage tracker, exam eligibility indicators, subject breakdown cards with progress bars, and historical logs table.

---

## 📁 Project Structure

```
.
├── app.py                   # FastAPI REST API backend
├── database.py              # SQLite database schema and connection helper
├── seed_db.py               # Populates SQLite database with initial demo data
├── main.py                  # Standalone CLI face dataset collection tool
├── generate_embeddings.py   # Extracts ArcFace embeddings to embeddings/embeddings.pkl
├── recognize.py             # Standalone CLI real-time recognition script
├── attendence.py            # CSV attendance logging utility
├── dataset/                 # Student face images organized by person subfolders
├── embeddings/              # ArcFace embedding vector pickle file (embeddings.pkl)
├── models/                  # YuNet ONNX face detection model weights
├── frontend/                # React (Vite) web application
│   ├── src/                 # React components and modern CSS design system
│   └── package.json
└── requirements.txt         # Python backend dependencies
```

---

## 🚀 Getting Started

### 1. Prerequisites

- Python 3.9+
- Node.js 18+ and `npm`

### 2. Backend Setup

Create a virtual environment and install Python dependencies:

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On macOS/Linux:
source .venv/bin/activate
# On Windows:
# .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Initialize Database

Seed the SQLite database (`attendance_system.db`) with demo sections, subjects, and accounts:

```bash
python seed_db.py
```

**Demo Accounts**:
- **Teacher**: `teacher@school.com` / `password123`
- **Student (Siva)**: `siva@school.com` / `password123`
- **Student (Harsha)**: `harsha@school.com` / `password123`
- **Student (Hrishi)**: `hrishi@school.com` / `password123`

### 4. Frontend Setup

In the `frontend` directory, install Node packages:

```bash
cd frontend
npm install
cd ..
```

---

## 💻 Running the Application

1. **Start the FastAPI Backend Server**:
   ```bash
   python app.py
   ```
   *Backend API runs at `http://localhost:5001` (API documentation available at `http://localhost:5001/docs`).*

2. **Start the React Frontend Dev Server**:
   ```bash
   cd frontend
   npm run dev
   ```
   *Open `http://localhost:5173` in your browser.*

---

## 🛠️ Standalone CLI Tools

If you prefer terminal-based operation without the web interface:

1. **Capture Face Dataset**:
   ```bash
   python main.py
   ```
   Captures face photos via webcam and saves them into `dataset/<PersonName>/`.

2. **Generate ArcFace Embeddings**:
   ```bash
   python generate_embeddings.py
   ```
   Processes images in `dataset/` and outputs `embeddings/embeddings.pkl`.

3. **Real-time Live Recognition**:
   ```bash
   python recognize.py
   ```
   Runs continuous webcam recognition and appends attendance records to `Attendence.csv`.
