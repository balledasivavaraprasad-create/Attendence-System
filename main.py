import cv2
import os

MAX_IMAGES = 30
SAVE_EVERY = 5

person_name = input("Enter Person Name : ").strip()

folder_path = os.path.join("dataset", person_name)
os.makedirs(folder_path, exist_ok=True)

image_count = len(os.listdir(folder_path)) + 1

frame_count = 0

detector = cv2.FaceDetectorYN.create(
    "/Users/siva/Documents/OpenCV/Attendence System/models/face_detection_yunet_2023mar.onnx",
    "",
    (320,320),
    0.6,
    0.3,
    5000
)
print(detector)

cap = cv2.VideoCapture(0)

cap.set(cv2.CAP_PROP_FRAME_WIDTH,1200)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

dataset_completed = False

while True :
    success, frame = cap.read()

    if not success :
        break

    cv2.flip(frame, 1)

    height , width = frame.shape[:2]

    detector.setInputSize((320,320))

    small_frame = cv2.resize(frame, (320,320))

    _, faces = detector.detect(small_frame)

    face_crop = None

    if faces is not None :

        scale_x = width/320
        scale_y = height/320

        for face in faces :
            x,y,w,h = face[:4]

            x = int(x * scale_x)
            y = int(y * scale_y)
            w = int(w * scale_x)
            h = int(h * scale_y)

            confidence = face[-1]

            face_crop = frame[y:y+h,x:x+w]

            cv2.rectangle(
                frame,
                (x,y),
                (x+w,y+h),
                (0,255,0),
                2
            )

            cv2.putText(
                frame,
                f"confidence {confidence:.2f}",
                (x,y-10),
                cv2.FONT_HERSHEY_COMPLEX,
                0.6,
                (0,255,0),
                2
            )

            landmarks = face[4:14].reshape(5,2)

            for point in landmarks :

                px = int(point[0] * scale_x)
                py = int(point[1] * scale_y)

                cv2.circle(
                    frame,
                    (px,py),
                    3,
                    (0,0,255),
                    -1
                )

            frame_count += 1

            if frame_count % SAVE_EVERY == 0 and image_count <= MAX_IMAGES :
                filename = os.path.join(
                    folder_path,
                    f"{image_count}.jpg"
                )

                cv2.imwrite(filename, face_crop)

                print(f"Saved -> {filename}")

                image_count += 1

    cv2.putText(
        frame,
        f"Collected : {min(image_count-1,MAX_IMAGES)}/{MAX_IMAGES}",
        (20,40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (255,0,0),
        2
    )

    cv2.imshow("Face Attendence System", frame)

    if image_count > MAX_IMAGES :

        cv2.putText(
            frame,
            "Dataset Collection Complete",
            (200,80),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0,255,0 ),
            2
        )

        dataset_completed = True

    cv2.imshow("Face DFetection System", frame)

    if dataset_completed :
        cv2.waitKey(1500)
        break

    key = cv2.waitKey(1) & 0xFF

    if key == ord('q') :
        break

cap.release()
cv2.destroyAllWindows()
