from io import StringIO
import streamlit as st
import openai
from resume_parser import (
    extract_resume_text, extract_skills, extract_education,
    extract_experience, generate_improvement_suggestions,
    calculate_score_breakdown
)
from database import insert_analysis, fetch_all_analysis

# --- Streamlit UI Config ---
st.set_page_config(page_title="Smart Resume Analyzer", layout="centered")

# --- Page Titles ---
st.title("📄 Smart Resume Analyzer System")
st.header("📂 Analyze Your Resume Against Job Descriptions")
st.subheader("🔍 Compare skills, experience, and education levels.")

# --- Custom CSS Styling ---
st.markdown("""
    <style>
    body {
        background-image: url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFsEPssJzxAUlMUyR3UIT8k6atX3tzwBYROQ&s');
        background-size: cover;
        background-position: center;
        background-attachment: fixed;
    }
    .stApp {
        background-color: rgba(0, 0, 0, 0.7);
        padding: 20px;
        border-radius: 12px;
        color: white;
    }
    h1, h2, h3, h4 {
        color: #00f5d4;
    }
    </style>
""", unsafe_allow_html=True)

# --- OpenAI Setup ---
openai.api_key = "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"  # Replace with your actual API key

# --- File Upload Section ---
st.markdown("## 📥 Upload Files")
uploaded_files = st.file_uploader("Upload one or more resumes", type=["pdf", "docx"], accept_multiple_files=True)
job_file = st.file_uploader("Upload job description", type=["txt"])

if uploaded_files and job_file:
    job_text = job_file.read().decode("utf-8")
    st.subheader("📊 Resume Match Scores")

    for uploaded_file in uploaded_files:
        resume_text = extract_resume_text(uploaded_file)
        score_breakdown = calculate_score_breakdown(resume_text, job_text)
        percent_match = score_breakdown["final_score"]
        insert_analysis(uploaded_file.name, job_file.name, percent_match / 100)

        st.markdown(f"### 📄 {uploaded_file.name}")
        st.progress(percent_match)
        st.write(f"✅ Final Match: **{percent_match}%**")

        st.markdown("### 🔍 Breakdown:")
        st.write(f"🧠 **Skill Match:** {score_breakdown['skill_score']}%")
        st.write(f"💼 **Experience Match:** {score_breakdown['experience_score']}%")
        st.write(f"🎓 **Education Match:** {score_breakdown['education_score']}%")

        full_feedback = ""
        if st.checkbox(f"🔍 Ask AI for detailed feedback on {uploaded_file.name}"):
            with st.spinner("🧠 Asking AI for feedback..."):
                try:
                    resume_trimmed = resume_text[:1500]
                    job_trimmed = job_text[:1500]

                    response = openai.ChatCompletion.create(
                        model="gpt-3.5-turbo",
                        messages=[
                            {"role": "system", "content": "You're an HR professional."},
                            {"role": "user", "content": f"Rate this resume:\n{resume_trimmed}\n\nFor this job:\n{job_trimmed}"}
                        ]
                    )
                    feedback = response['choices'][0]['message']['content']
                    st.subheader("🤖 AI Feedback")
                    st.write(feedback)
                    full_feedback += f"AI Feedback:\n{feedback}\n\n"

                except Exception as e:
                    st.warning(f"OpenAI API failed: {e}")

            score = percent_match / 100
            if score > 0.7:
                message = "🔥 Great match!"
                st.success(message)
            elif score > 0.4:
                message = "🧐 Moderate match."
                st.warning(message)
            else:
                message = "⚠️ Low match."
                st.error(message)
            full_feedback += f"Match Analysis: {message}\n\n"

            suggestions = generate_improvement_suggestions(resume_text, job_text)
            st.subheader("💡 Suggestions to Improve")
            for tip in suggestions:
                st.write(f"🔹 {tip}")
            full_feedback += "Suggestions:\n" + "\n".join([f"- {tip}" for tip in suggestions]) + "\n\n"

            important_skills = ['python', 'django', 'flask', 'sql', 'api', 'html', 'javascript', 'postgresql']
            job_keywords = job_text.lower().split()
            resume_keywords = resume_text.lower().split()
            missing_keywords = [word for word in important_skills if word in job_keywords and word not in resume_keywords]

            if missing_keywords:
                st.warning("👀 Your resume might be missing important keywords:")
                st.markdown(", ".join([f"❌ {word}" for word in missing_keywords]))
            else:
                st.success("✅ Your resume includes all key job keywords!")

            st.subheader("🎯 Skill Match Highlights")
            matched = [s for s in important_skills if s in resume_text.lower()]
            missing = [s for s in important_skills if s not in resume_text.lower()]

            if matched:
                st.markdown("✅ Skills Found: " + ", ".join([f"🟢 {s}" for s in matched]))
            if missing:
                st.markdown("❌ Skills Missing: " + ", ".join([f"🔴 {s}" for s in missing]))

            st.download_button(
                label="📥 Download Feedback",
                data=full_feedback,
                file_name=f"{uploaded_file.name}_feedback.txt",
                mime="text/plain"
            )

# --- History Section ---
st.markdown("---")
st.header("📁 View Past Resume Analyses")

if st.button("📂 Show Analysis History"):
    records = fetch_all_analysis()
    if records:
        st.subheader("🔍 Search Analysis History")
        search_term = st.text_input("Search by Resume or Job Name")
        filtered = [r for r in records if search_term.lower() in r[1].lower() or search_term.lower() in r[2].lower()] if search_term else records

        for r in filtered:
            resume_id, resume_name, job_name, match_score, timestamp = r
            st.markdown(
                f"**Resume:** `{resume_name}` | **Job:** `{job_name}` | "
                f"**Score:** `{round(match_score * 100)}%` | ⏰ `{timestamp}`"
            )
            st.markdown("---")
    else:
        st.info("No analysis history found.")
