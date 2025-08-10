// js/app.js
// Client-side resume analyzer for GitHub Pages
// Uses pdf.js and mammoth (loaded from CDN in index.html)

(() => {
  // Important lists ported from your Python logic
  const IMPORTANT_SKILLS = ['python','django','flask','sql','api','html','javascript','postgresql','machine learning','data analysis'];
  const EXPERIENCE_KEYWORDS = ['experience','worked at','project','internship','responsible for'];
  const EDUCATION_KEYWORDS = ['bachelor','master','b.tech','m.tech','phd','b.sc','m.sc','graduation','engineering','degree','university','college'];

  // Elements
  const resumeInput = document.getElementById('resume-input');
  const jobInput = document.getElementById('job-input');
  const analyzeBtn = document.getElementById('analyze-btn');
  const resultsDiv = document.getElementById('results');
  const historyList = document.getElementById('history-list');
  const showHistoryBtn = document.getElementById('show-history-btn');
  const historySearch = document.getElementById('history-search');
  const clearHistoryBtn = document.getElementById('clear-history-btn');

  // ---------- Utilities ----------

  function readTextFile(file){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  async function extractTextFromPDF(file){
    try{
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
      const pdf = await loadingTask.promise;
      let fullText = '';
      for(let i=1;i<=pdf.numPages;i++){
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strs = content.items.map(item => item.str);
        fullText += strs.join(' ') + '\n';
      }
      return fullText;
    }catch(e){
      console.warn("PDF parse error:", e);
      return `❌ Error reading PDF: ${e.message || e}`;
    }
  }

  async function extractTextFromDocx(file){
    try{
      const arrayBuffer = await file.arrayBuffer();
      // mammoth returns HTML; we'll strip tags to plain text
      const result = await mammoth.convertToHtml({arrayBuffer});
      const html = result.value || '';
      const div = document.createElement('div');
      div.innerHTML = html;
      const text = div.innerText || div.textContent || '';
      return text;
    }catch(e){
      console.warn("DOCX parse error:", e);
      return `❌ Error reading DOCX: ${e.message || e}`;
    }
  }

  async function extractResumeText(file){
    const name = file.name.toLowerCase();
    if(name.endsWith('.pdf')) return await extractTextFromPDF(file);
    if(name.endsWith('.docx')) return await extractTextFromDocx(file);
    return '❌ Unsupported file type. Please upload a PDF or DOCX resume.';
  }

  // ---------- Parsing & Scoring ----------

  function extract_skills_from_text(text){
    const t = text.toLowerCase();
    const found = IMPORTANT_SKILLS.filter(s => t.includes(s.toLowerCase()));
    return [...new Set(found)];
  }

  function extract_education(text){
    const lines = text.toLowerCase().split(/\r?\n/);
    const found = lines.filter(line => EDUCATION_KEYWORDS.some(k => line.includes(k)));
    return found;
  }

  function extract_experience(text){
    // find the largest number of years mentioned (e.g. "3 years", "5+ years")
    const matches = [];
    const re = /(\d+)\+?\s+years?/ig;
    let m;
    while((m = re.exec(text)) !== null){
      matches.push(parseInt(m[1], 10));
    }
    if(matches.length) return `${Math.max(...matches)} years`;
    return 'Not clearly mentioned';
  }

  function generate_improvement_suggestions(resume_text, job_text){
    const suggestions = [];
    const jobKeywords = job_text.toLowerCase().split(/\W+/);
    const resumeKeywords = new Set(resume_text.toLowerCase().split(/\W+/));

    const missing = jobKeywords.filter(k => k && !resumeKeywords.has(k));
    const missSet = new Set(missing);

    if(missSet.has('python')) suggestions.push('Mention Python if you have experience with it.');
    if(missSet.has('machine') || missSet.has('learning')) suggestions.push('Include Machine Learning projects or skills.');
    if(missSet.has('team')) suggestions.push('Show teamwork or collaboration experience.');
    if(missSet.has('project')) suggestions.push('Add details about relevant projects.');
    if(missSet.has('experience')) suggestions.push('Clearly state your years of experience.');

    if(suggestions.length === 0) suggestions.push('Great job! Your resume already aligns well.');

    return suggestions;
  }

  function calculate_score_breakdown(resume_text, job_text){
    const resume_lower = resume_text.toLowerCase();
    const job_lower = job_text.toLowerCase();

    const matched_skills = IMPORTANT_SKILLS.filter(s => resume_lower.includes(s));
    const matched_experience = EXPERIENCE_KEYWORDS.filter(k => resume_lower.includes(k));
    const matched_education = EDUCATION_KEYWORDS.filter(k => resume_lower.includes(k));

    const skill_score = Math.round((matched_skills.length / IMPORTANT_SKILLS.length) * 100);
    const experience_score = Math.round((matched_experience.length / EXPERIENCE_KEYWORDS.length) * 100);
    const education_score = Math.round((matched_education.length / EDUCATION_KEYWORDS.length) * 100);

    const total_score = Math.round((skill_score + experience_score + education_score) / 3);

    return {
      skill_score,
      experience_score,
      education_score,
      final_score: total_score
    };
  }

  // ---------- localStorage History ----------

  const STORAGE_KEY = 'resumeAnalyzer_history_v1';

  function loadHistory(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return [];
      return JSON.parse(raw);
    }catch(e){
      console.warn('Could not load history', e);
      return [];
    }
  }

  function saveHistory(records){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records || []));
  }

  function addHistoryEntry(entry){
    const records = loadHistory();
    records.unshift(entry); // newest first
    // limit history size to 200
    if(records.length > 200) records.length = 200;
    saveHistory(records);
  }

  function clearHistory(){
    localStorage.removeItem(STORAGE_KEY);
    renderHistory([]);
  }

  // ---------- UI Rendering ----------

  function formatDateISO(ts){
    const d = new Date(ts);
    return d.toLocaleString();
  }

  function createDownloadFile(filename, text){
    const blob = new Blob([text], {type:'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function renderResultsCard(res){
    const card = document.createElement('div');
    card.className = 'card';

    const title = document.createElement('h3');
    title.textContent = `📄 ${res.resume_name}`;
    title.style.margin = '0 0 8px 0';

    const progressWrap = document.createElement('div');
    progressWrap.className = 'progress-wrap row';

    const progress = document.createElement('progress');
    progress.setAttribute('max', '100');
    progress.value = res.percent_match;

    const percentText = document.createElement('div');
    percentText.innerHTML = `<strong>${res.percent_match}%</strong>`;

    progressWrap.appendChild(progress);
    progressWrap.appendChild(percentText);

    const breakdown = document.createElement('div');
    breakdown.className = 'small';
    breakdown.innerHTML = `
      🧠 Skill Match: ${res.breakdown.skill_score}% &nbsp;|&nbsp;
      💼 Experience Match: ${res.breakdown.experience_score}% &nbsp;|&nbsp;
      🎓 Education Match: ${res.breakdown.education_score}%
    `;

    const badges = document.createElement('div');
    badges.className = 'badges';

    const matched = res.matched_skills || [];
    const missing = res.missing_skills || [];

    if(matched.length){
      const b = document.createElement('div'); b.className='badge'; b.textContent = '✅ Skills: ' + matched.join(', ');
      badges.appendChild(b);
    }
    if(missing.length){
      const b = document.createElement('div'); b.className='badge'; b.textContent = '❌ Missing: ' + missing.join(', ');
      badges.appendChild(b);
    }

    const suggestionsWrap = document.createElement('div');
    suggestionsWrap.style.marginTop = '8px';
    suggestionsWrap.innerHTML = `<strong>💡 Suggestions:</strong>`;
    const ul = document.createElement('ul');
    res.suggestions.forEach(s => {
      const li = document.createElement('li');
      li.textContent = s;
      ul.appendChild(li);
    });
    suggestionsWrap.appendChild(ul);

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'download-btn';
    downloadBtn.textContent = '📥 Download Feedback';
    downloadBtn.onclick = () => {
      const feedback = buildFeedbackText(res);
      createDownloadFile(`${res.resume_name}_feedback.txt`, feedback);
    };

    card.appendChild(title);
    card.appendChild(progressWrap);
    card.appendChild(breakdown);
    card.appendChild(badges);
    card.appendChild(suggestionsWrap);
    card.appendChild(downloadBtn);

    return card;
  }

  function renderHistory(records){
    historyList.innerHTML = '';
    if(!records || records.length === 0){
      historyList.innerHTML = '<div class="small">No analysis history found.</div>';
      return;
    }
    records.forEach(r => {
      const item = document.createElement('div');
      item.className = 'history-item';
      const meta = document.createElement('div');
      meta.innerHTML = `<div><strong>${r.resume_name}</strong> for <em>${r.job_name}</em></div>
                        <div class="history-meta">Score: ${Math.round(r.score * 100)}% • ${formatDateISO(r.created_at)}</div>`;
      const actions = document.createElement('div');
      const dl = document.createElement('button');
      dl.className = 'download-btn';
      dl.textContent = 'Download';
      dl.onclick = () => createDownloadFile(`${r.resume_name}_feedback.txt`, r.feedback || buildFeedbackTextFromHistory(r));
      actions.appendChild(dl);
      item.appendChild(meta);
      item.appendChild(actions);
      historyList.appendChild(item);
    });
  }

  // ---------- Helpers for feedback text ----------

  function buildFeedbackText(res){
    let txt = '';
    txt += `Resume: ${res.resume_name}\n`;
    txt += `Job: ${res.job_name}\n`;
    txt += `Score: ${res.percent_match}%\n\n`;
    txt += `Breakdown:\n`;
    txt += ` - Skills: ${res.breakdown.skill_score}%\n`;
    txt += ` - Experience: ${res.breakdown.experience_score}%\n`;
    txt += ` - Education: ${res.breakdown.education_score}%\n\n`;
    txt += `Suggestions:\n`;
    res.suggestions.forEach(s => txt += ` - ${s}\n`);
    if(res.missing_skills && res.missing_skills.length){
      txt += `\nMissing keywords: ${res.missing_skills.join(', ')}\n`;
    }
    txt += `\nGenerated at: ${formatDateISO(res.created_at)}`;
    return txt;
  }

  function buildFeedbackTextFromHistory(h){
    // history stores minimal info; reconstruct text
    const txt = `Resume: ${h.resume_name}\nJob: ${h.job_name}\nScore: ${Math.round(h.score * 100)}%\nGenerated at: ${formatDateISO(h.created_at)}\n\n(Full feedback not saved)`;
    return txt;
  }

  // ---------- Main analyze flow ----------

  async function analyze(){
    resultsDiv.innerHTML = '';
    const resumes = Array.from(resumeInput.files || []);
    const jobFile = jobInput.files && jobInput.files[0];

    if(resumes.length === 0 || !jobFile){
      alert('Please upload at least one resume (PDF/DOCX) and a job description (TXT).');
      return;
    }

    // read job text
    let jobText = '';
    try{
      jobText = await readTextFile(jobFile);
    }catch(e){
      jobText = '';
    }

    // process each resume sequentially
    for(const f of resumes){
      // show a temporary card "processing..."
      const processingCard = document.createElement('div');
      processingCard.className = 'card';
      processingCard.innerHTML = `<div><strong>🔄 Processing ${f.name}...</strong></div><div class="small">This may take a few seconds for PDFs.</div>`;
      resultsDiv.appendChild(processingCard);

      const resumeText = await extractResumeText(f);
      const breakdown = calculate_score_breakdown(resumeText, jobText);
      const percent_match = breakdown.final_score; // 0-100

      const matched_skills = extract_skills_from_text(resumeText);
      const missing_skills = IMPORTANT_SKILLS.filter(s => !matched_skills.includes(s));

      const suggestions = generate_improvement_suggestions(resumeText, jobText);
      const created_at = Date.now();

      const resultObj = {
        resume_name: f.name,
        job_name: jobFile.name,
        percent_match,
        breakdown,
        matched_skills,
        missing_skills,
        suggestions,
        created_at
      };

      // replace processing card with final card
      resultsDiv.removeChild(processingCard);
      const finalCard = renderResultsCard({
        resume_name: resultObj.resume_name,
        job_name: resultObj.job_name,
        percent_match: resultObj.percent_match,
        breakdown: resultObj.breakdown,
        matched_skills: resultObj.matched_skills,
        missing_skills: resultObj.missing_skills,
        suggestions: resultObj.suggestions,
        created_at: resultObj.created_at
      });
      resultsDiv.appendChild(finalCard);

      // store in history (score stored as 0..1 to mirror python DB style)
      addHistoryEntry({
        id: created_at.toString(),
        resume_name: resultObj.resume_name,
        job_name: resultObj.job_name,
        score: resultObj.percent_match / 100,
        created_at: created_at,
        // optional short feedback saved in history
        feedback: buildFeedbackText(resultObj)
      });
    }
  }

  // ---------- Event Listeners ----------

  analyzeBtn.addEventListener('click', async (e) => {
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing...';
    try{
      await analyze();
    }catch(err){
      console.error('Analysis failed', err);
      alert('Analysis failed: ' + (err.message || err));
    }finally{
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = 'Analyze';
    }
  });

  showHistoryBtn.addEventListener('click', () => {
    const all = loadHistory() || [];
    const q = (historySearch.value || '').trim().toLowerCase();
    const filtered = q ? all.filter(r => r.resume_name.toLowerCase().includes(q) || r.job_name.toLowerCase().includes(q)) : all;
    renderHistory(filtered);
  });

  historySearch.addEventListener('input', () => {
    // realtime filter if there's existing history shown
    const all = loadHistory() || [];
    const q = (historySearch.value || '').trim().toLowerCase();
    const filtered = q ? all.filter(r => r.resume_name.toLowerCase().includes(q) || r.job_name.toLowerCase().includes(q)) : all;
    renderHistory(filtered);
  });

  clearHistoryBtn.addEventListener('click', () => {
    if(confirm('Clear all saved analysis history from this browser?')){
      clearHistory();
    }
  });

  // On load: render stored history if any
  document.addEventListener('DOMContentLoaded', () => {
    const existing = loadHistory();
    renderHistory(existing);
  });

})();
