import csv
import os
from datetime import datetime

ATTENDENCE_FILE = "Attendence.csv"
marked_people = set()

def mark_attendance(name, section_name="General", subject_name="General"):
    if not name or name == "Unknown":
        return

    key = f"{name}_{section_name}_{subject_name}_{datetime.now().strftime('%Y-%m-%d')}"
    if key in marked_people:
        return

    file_exists = os.path.exists(ATTENDENCE_FILE)

    with open(ATTENDENCE_FILE, "a", newline="") as file:
        writer = csv.writer(file)

        if not file_exists:
            writer.writerow(["Name", "Section", "Subject", "Date", "Time"])

        now = datetime.now()
        date = now.strftime("%Y-%m-%d")
        time = now.strftime("%H:%M:%S")

        writer.writerow([name, section_name, subject_name, date, time])

    marked_people.add(key)
    print(f"{name} attendance marked for {section_name} - {subject_name}.")



