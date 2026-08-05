from deepface import DeepFace
import os
import pickle

DATASET_PATH = "dataset"
OUTPUT_FILE = "embeddings/embeddings.pkl"

os.makedirs("embeddings", exist_ok=True)

database = {}

for person_name in os.listdir(DATASET_PATH) :
    person_folder =os.path.join(DATASET_PATH, person_name)

    if not os.path.isdir(person_folder) :
        continue

    database[person_name] = []

    for image_name in os.listdir(person_folder) :
        image_path = os.path.join(person_folder, image_name)

        try :
            embedding = DeepFace.represent(
                img_path = image_path,
                model_name="ArcFace",
                enforce_detection = False, 
            )[0]["embedding"]

            database[person_name].append(embedding)

            print(f"Processed : {person_name}/{image_name}")

        except Exception as e:
            print(f"Error : {image_name}")
            print(e)

with open(OUTPUT_FILE , "wb") as file :

    pickle.dump(database, file)

print("Embeddings Saved Successfully...!!!")