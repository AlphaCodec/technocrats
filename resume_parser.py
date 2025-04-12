import fitz  # PyMuPDF
import docx

def extract_text_from_pdf(file):
    try:
        file_buffer = file.read()
        doc = fitz.open(stream=file_buffer, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    except Exception as e:
        return f"❌ Error reading PDF: {e}"

def extract_text_from_docx(file):
    try:
        doc = docx.Document(file)
        return "\n".join([para.text for para in doc.paragraphs])
    except Exception as e:
        return f"❌ Error reading DOCX: {e}"

def extract_resume_text(file):
    filename = file.name.lower()
    if filename.endswith(".pdf"):
        return extract_text_from_pdf(file)
    elif filename.endswith(".docx"):
        return extract_text_from_docx(file)
    else:
        return "❌ Unsupported file type. Please upload a PDF or DOCX resume."
import re

def extract_skills(text):
    skill_keywords = ["python", "java", "c++", "sql", "excel", "pandas", "numpy", "tensorflow", "machine learning", "data analysis"]
    found_skills = [skill for skill in skill_keywords if skill.lower() in text.lower()]
    return found_skills

def extract_education(text):
    education_keywords = ["bachelor", "master", "b.tech", "m.tech", "phd", "b.sc", "m.sc", "graduation", "engineering"]
    education_found = [line for line in text.lower().split("\n") if any(keyword in line for keyword in education_keywords)]
    return education_found

def extract_experience(text):
    experience_years = re.findall(r"(\d+)\+?\s+years?", text.lower())
    if experience_years:
        return f"{max([int(x) for x in experience_years])} years"
    else:
        return "Not clearly mentioned"

def generate_improvement_suggestions(resume_text, job_text):
    suggestions = []

    job_keywords = job_text.lower().split()
    resume_keywords = resume_text.lower().split()

    missing_keywords = set(job_keywords) - set(resume_keywords)

    if "python" in missing_keywords:
        suggestions.append("Mention Python if you have experience with it.")
    if "machine" in missing_keywords or "learning" in missing_keywords:
        suggestions.append("Include Machine Learning projects or skills.")
    if "team" in missing_keywords:
        suggestions.append("Show teamwork or collaboration experience.")
    if "project" in missing_keywords:
        suggestions.append("Add details about relevant projects.")
    if "experience" in missing_keywords:
        suggestions.append("Clearly state your years of experience.")

    if not suggestions:
        suggestions.append("Great job! Your resume already aligns well.")

    return suggestions

def calculate_score_breakdown(resume_text, job_text):
    resume_lower = resume_text.lower()
    job_lower = job_text.lower()

    # Keywords to check
    important_skills = ['python', 'django', 'flask', 'sql', 'api', 'html', 'javascript', 'postgresql', 'machine learning', 'data analysis']
    experience_keywords = ['experience', 'worked at', 'project', 'internship', 'responsible for']
    education_keywords = ['bachelor', 'master', 'b.sc', 'm.sc', 'degree', 'university', 'college']

    # Count matches
    matched_skills = [skill for skill in important_skills if skill in resume_lower]
    matched_experience = [word for word in experience_keywords if word in resume_lower]
    matched_education = [word for word in education_keywords if word in resume_lower]

    # Scores out of 100
    skill_score = int((len(matched_skills) / len(important_skills)) * 100)
    experience_score = int((len(matched_experience) / len(experience_keywords)) * 100)
    education_score = int((len(matched_education) / len(education_keywords)) * 100)

    # Final score = average (you can change this weight later)
    total_score = int((skill_score + experience_score + education_score) / 3)

    return {
        "skill_score": skill_score,
        "experience_score": experience_score,
        "education_score": education_score,
        "final_score": total_score
    }
