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
├── dataset/                 # Student face images directory (local user dataset)
├── embeddings/              # ArcFace embedding vector pickle file (embeddings.pkl)
├── models/                  # YuNet ONNX face detection model weights
├── frontend/                # React (Vite) web application
│   ├── src/                 # React components and modern CSS design system
│   └── package.json
└── requirements.txt         # Python backend dependencies
```

---

## 🚀 Step-by-Step Setup Guide

Follow these steps to clone the repository and run the application locally on your system.

### 1. Clone the Repository

Open your terminal and clone the repository:

```bash
git clone https://github.com/balledasivavaraprasad-create/Attendence-System.git
cd Attendence-System
```

---

### 2. Set Up Python Virtual Environment & Dependencies

Create and activate a virtual environment, then install backend dependencies:

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On macOS / Linux:
source .venv/bin/activate

# On Windows (Command Prompt / PowerShell):
# .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

---

### 3. Install Frontend Dependencies

Navigate into the `frontend` folder and install Node.js packages:

```bash
cd frontend
npm install
cd ..
```

---

### 4. Initialize Database

Seed the SQLite database (`attendance_system.db`) with initial sections, subjects, and accounts:

```bash
python seed_db.py
```

**Demo Accounts**:
- **Teacher**: `teacher@school.com` / `password123`
- **Student (Siva)**: `siva@school.com` / `password123`
- **Student (Harsha)**: `harsha@school.com` / `password123`
- **Student (Hrishi)**: `hrishi@school.com` / `password123`

---

### 5. Create Your Student Face Dataset & Generate Embeddings

> 🔒 **Privacy Note**: Face photos are kept local to your machine and are excluded from Git for privacy.

You need to populate student face images and generate ArcFace embedding vectors before running recognition.

#### **Option A: Capture Face Photos via Webcam (CLI)**
Run the dataset collection tool:
```bash
python main.py
```
Enter the student's dataset folder name (e.g. `Siva`) when prompted. The script will capture 30 face images from your webcam into `dataset/<PersonName>/`.

#### **Option B: Upload via Web UI**
Use the **Dataset Manager** tab in the Teacher Dashboard of the web application to upload face images.

#### **Generate Feature Embeddings**:
After adding or updating face photos in `dataset/`, run:
```bash
python generate_embeddings.py
```
This extracts ArcFace feature representations and creates `embeddings/embeddings.pkl`.

---

## 💻 Running the Full-Stack Application

To run the complete system, open **two separate terminal windows**:

### **Terminal 1: Start FastAPI Backend**
```bash
# Ensure virtual environment is active
source .venv/bin/activate   # On Windows: .venv\Scripts\activate

# Start backend server
python app.py
```
*Backend API runs at `http://localhost:5001` (Interactive API docs at `http://localhost:5001/docs`).*

### **Terminal 2: Start React Frontend**
```bash
# Navigate to frontend folder and start Vite
cd frontend
npm run dev
```
*Open **`http://localhost:5173`** in your web browser.*

---

## 🛠️ Standalone CLI Tools

If you prefer operating directly from the command line without launching the web interface:

1. **Capture Face Dataset**:
   ```bash
   python main.py
   ```
2. **Generate ArcFace Embeddings**:
   ```bash
   python generate_embeddings.py
   ```
3. **Live Recognition & CSV Logging**:
   ```bash
   python recognize.py
   ```
