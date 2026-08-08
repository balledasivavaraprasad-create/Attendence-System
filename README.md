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

## 🚀 Step-by-Step Installation & Setup Guide

Follow this guide to clone the repository, set up your local environment, generate your facial dataset, and run both frontend and backend servers.

### 1. Clone the Repository

Open your terminal and clone the repository:

```bash
git clone https://github.com/balledasivavaraprasad-create/Attendence-System.git
cd Attendence-System
```

---

### 2. Set Up Python Virtual Environment & Install Dependencies

Create a virtual environment to isolate project packages, activate it, and install dependencies:

```bash
# Create Python virtual environment
python -m venv .venv

# Activate virtual environment
# On macOS / Linux:
source .venv/bin/activate

# On Windows (Command Prompt / PowerShell):
# .venv\Scripts\activate

# Install required Python packages
pip install -r requirements.txt
```

---

### 3. Install Frontend Node Packages

Navigate to the `frontend` folder and install Node.js dependencies:

```bash
cd frontend
npm install
cd ..
```

---

### 4. Initialize SQLite Database

Initialize and seed the database (`attendance_system.db`) with initial demo sections, subjects, and accounts:

```bash
python seed_db.py
```

**Pre-seeded Demo Accounts**:
- **Teacher**: `teacher@school.com` / `password123`
- **Student (Siva)**: `siva@school.com` / `password123` (Dataset folder: `Siva`)
- **Student (Harsha)**: `harsha@school.com` / `password123` (Dataset folder: `harsha`)
- **Student (Hrishi)**: `hrishi@school.com` / `password123` (Dataset folder: `hrishi`)

---

### 5. Create Your Student Face Dataset & Generate Embeddings

> 🔒 **Privacy Note**: Facial dataset images (`dataset/`) and raw camera captures (`CapturedFaces/`) are kept local to your machine and are excluded from Git repository tracking for privacy.

To perform facial recognition, you must collect student face images in `dataset/<StudentName>/` and extract ArcFace vector embeddings.

#### **Step 5A: Collect Student Face Images**

Choose one of two methods to build your dataset:

* **Method 1: Interactive CLI Collector (Recommended)**
  Run the webcam capture script:
  ```bash
  python main.py
  ```
  1. Enter the student's dataset folder name when prompted (e.g., `Siva`).
  2. The script opens your camera, detects your face using YuNet, and automatically captures 30 face images into `dataset/Siva/`.
  3. Press `q` to quit at any time.

* **Method 2: Web UI Dataset Uploader**
  Log into the Web UI as a Teacher (`teacher@school.com`), navigate to the **Dataset Manager** tab, enter the student dataset name, and upload face image files directly.

#### **Step 5B: Generate ArcFace Feature Embeddings**

After collecting images for your students in `dataset/`, run the embedding extractor script:

```bash
python generate_embeddings.py
```

This script reads images inside `dataset/`, calculates ArcFace feature vectors using DeepFace, and saves them to `embeddings/embeddings.pkl`.

---

## 💻 Running the Full-Stack Web Application

To run the application, open **two separate terminal windows** side-by-side:

### **Terminal 1: Start FastAPI Backend API**
```bash
# Make sure virtual environment is active
source .venv/bin/activate   # On Windows: .venv\Scripts\activate

# Start the FastAPI server
python app.py
```
*The REST backend runs on **`http://localhost:5001`**. (Swagger API docs available at `http://localhost:5001/docs`).*

### **Terminal 2: Start React Frontend**
```bash
# Navigate to frontend and start Vite server
cd frontend
npm run dev
```
*The React UI runs on **`http://localhost:5173`**.*

Open **`http://localhost:5173`** in your browser to access the application.

---

## 🛠️ Standalone CLI Commands Summary

If you prefer terminal-only workflows without launching the web interface:

1. **Collect Face Dataset**: `python main.py`
2. **Generate ArcFace Embeddings**: `python generate_embeddings.py`
3. **Live Camera Recognition & CSV Logging**: `python recognize.py`
