import csv
import os
from datetime import datetime

ATTENDENCE_FILE = "Attendence.csv"

marked_people = set()

def mark_attendance(name) :

    if name == "Unknown" :
        return

    if name in marked_people :
        return

    file_exists = os.path.exists(ATTENDENCE_FILE)

    with open(ATTENDENCE_FILE,"a",newline="") as file :
        writer = csv.writer(file)

        if not file_exists:
            writer.writerow([
                "Name",
                "Date",
                "Time"
            ])

        now = datetime.now()

        date = now.strftime("%Y-%m-%d")

        time = now.strftime("%H:%M:%S")

        writer.writerow([
            name,
            date,
            time
        ])

    marked_people.add(name)

    print(f"{name} attendence marked.")



