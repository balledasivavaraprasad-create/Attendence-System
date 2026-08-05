import cv2
import pickle
import numpy as np
from deepface import DeepFace
from attendence import mark_attendance

EMBEDDING_FILE = "embeddings/embeddings.pkl"
thresh = 5.0

with open(EMBEDDING_FILE, "rb") as file :
    database = pickle.load(file)

print("Embedddings loaded successfully...!!!")

detector = cv2.FaceDetectorYN.create(
    "/Users/siva/Documents/OpenCV/Attendence System/models/face_detection_yunet_2023mar.onnx",
    "",
    (320,320),
    0.6,
    0.3,
    5000,
)

cap = cv2.VideoCapture(0)

cap.set(cv2.CAP_PROP_FRAME_WIDTH,1200)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT,700)

while True :
    success, frame = cap.read()

    if not success : 
        break

    cv2.flip(frame, 1)

    height , width = frame.shape[:2]

    detector.setInputSize((width,height))

    _, faces = detector.detect(frame)

    if faces is not None :
        for face in faces :
            x,y,w,h = face[:4].astype(int)

            face_crop = frame[y:y+h,x:x+w]

            if face_crop.size == 0:
                continue
            
            face_crop = cv2.cvtColor(
                face_crop,
                cv2.COLOR_BGR2RGB
            )

            try :
                current_embedding = DeepFace.represent(
                    img_path = face_crop,
                    model_name="ArcFace",
                    enforce_detection=False
                )[0]["embedding"]
            except Exception :
                continue

            best_person = "Unknown"
            best_distance = float("inf")

            for person_name, embeddings in database.items() :
                for stored_embeddings in embeddings :

                    distance = np.linalg.norm(
                        np.array(current_embedding)-np.array(stored_embeddings)
                    )

                    if distance < best_distance :
                        best_distance = distance
                        best_person = person_name
            if best_distance > thresh :

                best_person = "Unknown"

            if best_person != "Unknown":
                mark_attendance(best_person)

            cv2.rectangle(
                frame,
                (x,y),
                (x+w, y+h),
                (0,255,0),
                2,
            )

            cv2.putText(
                frame,
                f"{best_person} ({best_distance : .2f})",
                (x,y-10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0,255,0),
                2
            )

    cv2.imshow("Face Recognition", frame)

    key = cv2.waitKey(1) & 0xFF

    if key == ord('q') :
        break

cap.release()
cv2.destroyAllWindows()