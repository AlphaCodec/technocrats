skill_keywords = [
    "python", "java", "c++", "html", "css", "javascript", "sql", 
    "machine learning", "data science", "excel", "communication",
    "teamwork", "leadership", "problem solving", "deep learning"
]

def extract_skills(text):
    text = text.lower()
    found_skills = [skill for skill in skill_keywords if skill in text]
    return list(set(found_skills))

def calculate_match(resume_skills, job_skills):
    if not job_skills:
        return 0
    matched = set(resume_skills).intersection(set(job_skills))
    return round(len(matched) / len(job_skills) * 100, 2)
