import sqlite3
from datetime import datetime

# ✅ Use the same DB file for both insert and fetch
DB_NAME = "resume_analysis.db"

# Create or connect to the database
conn = sqlite3.connect(DB_NAME, check_same_thread=False)
cursor = conn.cursor()

# ✅ Correct table definition
cursor.execute("""
CREATE TABLE IF NOT EXISTS analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_name TEXT,
    job_name TEXT,
    score REAL,
    created_at TEXT
)
""")
conn.commit()

# ✅ Insert function (uses current time manually)
def insert_analysis(resume_name, job_name, score):
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(
        "INSERT INTO analysis (resume_name, job_name, score, created_at) VALUES (?, ?, ?, ?)",
        (resume_name, job_name, score, created_at)
    )
    conn.commit()

# ✅ Fetch function (now reads from the correct DB!)
def fetch_all_analysis():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analysis ORDER BY created_at DESC")
    records = cursor.fetchall()
    conn.close()
    return records
