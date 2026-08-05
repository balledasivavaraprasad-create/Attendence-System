# Attendance System using Face Recognition

Real-time attendance logging system using OpenCV for face detection (YuNet) and DeepFace (ArcFace) for face recognition. The project captures face images via webcam, converts them into embeddings, matches live camera frames against stored embeddings, and logs attendance timestamps to a CSV file.

## Project Structure

```
.
├── main.py                   # Dataset collection (webcam face capture)
├── generate_embeddings.py   # Extracts ArcFace embeddings and saves to pkl
├── recognize.py             # Live face recognition and attendance tracking
├── attendence.py            # CSV logging utility
├── requirements.txt         # Required Python packages
├── dataset/                 # Captured face images organized by person
├── embeddings/              # Pickled embedding database (embeddings.pkl)
└── models/                  # YuNet ONNX face detection model
```

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/balledasivavaraprasad-create/Attendence-System.git
   cd Attendence-System
   ```

2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. Install required packages:
   ```bash
   pip install -r requirements.txt deepface
   ```

## Usage

### 1. Collect Face Dataset
Run `main.py` to capture face images for a new person. Enter the person's name when prompted.
```bash
python main.py
```
The script opens your webcam, detects faces using the YuNet model, and saves up to 30 face images in `dataset/<PersonName>/`. Press `q` to quit manually.

### 2. Generate Embeddings
After collecting images, extract ArcFace embeddings:
```bash
python generate_embeddings.py
```
This processes all images in `dataset/` and saves the feature vectors to `embeddings/embeddings.pkl`.

### 3. Run Recognition & Attendance Tracking
Start real-time recognition:
```bash
python recognize.py
```
When a registered person is detected with a match distance below the threshold, their attendance (Name, Date, Time) is written to `Attendence.csv`. Duplicate logs during the active session are automatically prevented.

## Attendance Log Format

The attendance records are saved in `Attendence.csv`:

```csv
Name,Date,Time
Siva,2026-08-05,18:45:12
```

## Note on Model Path
If you move the project directory, update the YuNet model path in `main.py` and `recognize.py` to match your local absolute or relative path:
`models/face_detection_yunet_2023mar.onnx`
