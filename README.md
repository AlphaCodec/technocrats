# Smart Resume Analyzer (Static)

This is a **static**, client-side resume analyzer that runs entirely in the browser and is suitable for hosting on **GitHub Pages**.

Features:
- Upload one or more resumes (PDF or DOCX) and a job description (TXT).
- Extract text from PDFs (pdf.js) and DOCX (mammoth.js).
- Score resumes on skills, experience and education.
- Show matched & missing keywords and suggestions to improve.
- Save analysis history in browser `localStorage`.
- Download feedback as text files.

## How to use
1. Clone this repo to your machine.
2. Optional: put a background image as `assets/placeholder-bg.jpg` or edit `index.html` CSS.
3. Commit and push to a GitHub repository.
4. Enable GitHub Pages in repository settings (serve from `main` branch / root).
5. Visit the GitHub Pages URL.

## Notes & limitations
- No OpenAI / AI feedback — intentionally removed for static hosting.
- Data is stored locally in the user's browser (`localStorage`).
- The DOCX parsing uses `mammoth.js`, which does a decent job extracting text but may not perfectly match complex DOCX formatting.
- Large PDFs may take noticeable time to parse in the browser.

If you'd like, I can:
- Convert this to a React app (better UX).
- Add an optional small Node proxy for OpenAI (if you later want AI features).
