// ======= OPENROUTER AI CONFIG =======
const OPENROUTER_API_KEY = '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'; // <--- Paste your key here!
const OPENROUTER_MODEL = 'nvidia/nemotron-3-nano-30b-a3b:free';

// ======= STATE =======
const appState = {
    subjects: JSON.parse(localStorage.getItem('subjects')) || [],
    tasks: JSON.parse(localStorage.getItem('tasks')) || [],
    notes: localStorage.getItem('notes') || '',
    timetable: JSON.parse(localStorage.getItem('timetable')) || [],
    quizzes: JSON.parse(localStorage.getItem('quizzes')) || [],
    timerInterval: null,
    currentTimerSeconds: 0
};

// ======= DOM =======
const dom = {
    navButtons: document.querySelectorAll('.nav-btn'),
    contentSections: document.querySelectorAll('.content-section'),
    subjectInput: document.getElementById('subjectInput'),
    subjectsGrid: document.getElementById('subjectsGrid'),
    taskInput: document.getElementById('taskInput'),
    tasksList: document.getElementById('tasksList'),
    notesTextarea: document.getElementById('notesTextarea'),
    timerInput: document.getElementById('timerInput'),
    timerDisplay: document.getElementById('timerDisplay'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    totalSubjects: document.getElementById('totalSubjects'),
    pendingTasks: document.getElementById('pendingTasks'),
    averageMarks: document.getElementById('averageMarks'),
    totalNotes: document.getElementById('totalNotes'),
    recentActivity: document.getElementById('recentActivity'),
    timetableDay: document.getElementById('timetableDay'),
    timetableTime: document.getElementById('timetableTime'),
    timetableSubject: document.getElementById('timetableSubject'),
    timetableGrid: document.getElementById('timetableGrid'),
    quizText: document.getElementById('quizText'),
    quizQuestions: document.getElementById('quizQuestions'),
    generateQuizBtn: document.getElementById('generateQuizBtn'),
    quizOutput: document.getElementById('quizOutput')
};

// ======= INIT =======
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initSubjects();
    initTasks();
    initNotes();
    initTimer();
    initTimetable();
    initQuiz();
    updateDashboard();
    loadAllData();
});

function initNavigation() {
    dom.navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            switchSection(btn.getAttribute('data-section'));
        });
    });
}
function switchSection(sectionName) {
    dom.navButtons.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-section') === sectionName);
    });
    dom.contentSections.forEach(section => {
        section.classList.toggle('active', section.id === `${sectionName}-section`);
    });
}

// ======= SUBJECTS =======
function initSubjects() {
    dom.subjectInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            appState.subjects.push({ id: Date.now(), name: e.target.value, createdAt: new Date().toLocaleDateString() });
            dom.subjectInput.value = '';
            saveSubjects(); renderSubjects(); updateDashboard(); addActivity('Added subject');
        }
    });
    renderSubjects();
}
function renderSubjects() {
    dom.subjectsGrid.innerHTML = appState.subjects.length === 0
        ? '<div class="no-subjects">No subjects added yet.</div>'
        : appState.subjects.map(s => `
        <div class="subject-card">
            <div class="subject-name">${escapeHtml(s.name)}</div>
            <div class="subject-meta">Added: ${s.createdAt}</div>
            <button class="btn-remove-subject" onclick="removeSubject(${s.id})">Remove</button>
        </div>`).join('');
}
function removeSubject(id) {
    appState.subjects = appState.subjects.filter(s => s.id !== id);
    saveSubjects(); renderSubjects(); updateDashboard(); addActivity('Removed subject');
}
function saveSubjects() { localStorage.setItem('subjects', JSON.stringify(appState.subjects)); }

// ======= TASKS =======
function initTasks() {
    dom.taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            appState.tasks.push({ id: Date.now(), text: e.target.value, completed: false, createdAt: new Date().toLocaleDateString() });
            dom.taskInput.value = '';
            saveTasks(); renderTasks(); updateDashboard(); addActivity('Added task');
        }
    });
    renderTasks();
}
function renderTasks() {
    dom.tasksList.innerHTML = appState.tasks.length === 0
        ? '<div class="no-tasks">No tasks yet.</div>'
        : appState.tasks.map(t => `
        <div class="task-item ${t.completed ? 'completed' : ''}">
            <input type="checkbox" ${t.completed ? 'checked' : ''} onclick="toggleTask(${t.id})">
            <span class="task-text">${escapeHtml(t.text)}</span>
            <button class="btn-remove-task" onclick="removeTask(${t.id})">Delete</button>
        </div>`).join('');
}
function toggleTask(id) {
    const t = appState.tasks.find(t => t.id === id);
    if (t) { t.completed = !t.completed; saveTasks(); renderTasks(); updateDashboard(); }
}
function removeTask(id) { appState.tasks = appState.tasks.filter(t => t.id !== id); saveTasks(); renderTasks(); updateDashboard(); }
function saveTasks() { localStorage.setItem('tasks', JSON.stringify(appState.tasks)); }

// ======= NOTES =======
function initNotes() {
    dom.notesTextarea.value = appState.notes;
    dom.notesTextarea.addEventListener('input', (e) => {
        appState.notes = e.target.value; localStorage.setItem('notes', appState.notes); updateDashboard();
    });
}

// ======= TIMER =======
function initTimer() {
    dom.timerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            let minutes = parseInt(e.target.value);
            if (minutes > 0) startTimer(minutes);
            dom.timerInput.value = '';
        }
    });
}
function startTimer(minutes) {
    if (appState.timerInterval) clearInterval(appState.timerInterval);
    appState.currentTimerSeconds = minutes * 60;
    updateTimerDisplay();
    appState.timerInterval = setInterval(() => {
        appState.currentTimerSeconds--;
        updateTimerDisplay();
        if (appState.currentTimerSeconds <= 0) {
            clearInterval(appState.timerInterval);
            alert('Timer finished!');
            addActivity('Study timer completed');
        }
    }, 1000);
}
function updateTimerDisplay() {
    const m = Math.floor(appState.currentTimerSeconds / 60);
    const s = appState.currentTimerSeconds % 60;
    dom.timerDisplay.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ======= TIMETABLE =======
function initTimetable() {
    dom.timetableSubject.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            if (!dom.timetableDay.value || !dom.timetableTime.value || !dom.timetableSubject.value.trim()) return alert('Fill all fields');
            appState.timetable.push({
                id: Date.now(), day: dom.timetableDay.value, time: dom.timetableTime.value,
                subject: dom.timetableSubject.value.trim(), createdAt: new Date().toLocaleDateString()
            });
            saveTimetable(); renderTimetable(); dom.timetableDay.value = dom.timetableTime.value = dom.timetableSubject.value = '';
            addActivity('Added timetable');
        }
    });
    renderTimetable();
}
function renderTimetable() {
    if (appState.timetable.length === 0) {
        dom.timetableGrid.innerHTML = '<div class="no-timetable">No timetable entries yet.</div>'; return;
    }
    let html = `<div class="timetable-header">Day</div>
    <div class="timetable-header">Time</div>
    <div class="timetable-header">Subject</div>
    <div class="timetable-header">Action</div>`;
    [...appState.timetable].forEach(entry => {
        html += `<div class="timetable-cell">${escapeHtml(entry.day)}</div>
        <div class="timetable-cell">${entry.time}</div>
        <div class="timetable-cell">${escapeHtml(entry.subject)}</div>
        <div class="timetable-cell">
            <button class="btn-remove-timetable" onclick="removeTimetableEntry(${entry.id})">Remove</button>
        </div>`;
    });
    dom.timetableGrid.innerHTML = html;
}
function removeTimetableEntry(id) { appState.timetable = appState.timetable.filter(entry => entry.id !== id); saveTimetable(); renderTimetable(); }
function saveTimetable() { localStorage.setItem('timetable', JSON.stringify(appState.timetable)); }

// ======= QUIZ (AI) =======
function initQuiz() {
    dom.generateQuizBtn.addEventListener('click', generateQuiz);
}
async function generateQuiz() {
    const studyText = dom.quizText.value.trim();
    const numQuestions = Math.max(1, Math.min(10, parseInt(dom.quizQuestions.value) || 5));
    if (!studyText) return showQuizError('Please enter study material.');
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'YOUR_OPENROUTER_API_KEY_HERE')
        return showQuizError('Paste your free OpenRouter API Key near the top of app.js!');
    showQuizLoading();
    try {
        const questions = await generateQuestionsWithOpenRouter(studyText, numQuestions);
        renderQuizQuestions(questions);
        appState.quizzes.push({
            id: Date.now(),
            text: studyText,
            questions: questions,
            createdAt: new Date().toLocaleDateString()
        });
        localStorage.setItem('quizzes', JSON.stringify(appState.quizzes));
        addActivity(`Generated ${numQuestions} quiz questions.`);
    } catch (e) {
        showQuizError(e);
    }
}
async function generateQuestionsWithOpenRouter(studyText, numQuestions) {
    const prompt = `
You are a senior university professor. Given the study material below, create exactly ${numQuestions} deep, high-quality multiple-choice questions that test real understanding and critical thinking. 
Each should have 4 options (A–D)���one correct, three plausible distractors—and a thorough explanation.
Respond ONLY in a JSON array, no intro, matching this format:
[
  {
    "questionNumber": 1,
    "question": "Your question here?",
    "options": {
      "A": "Plausible answer (not always correct)",
      "B": "Correct answer (evidence-based)",
      "C": "Another plausible option",
      "D": "Less likely but relevant option"
    },
    "correctAnswer": "B",
    "explanation": "Why B is correct and the rest are not."
  }
]
STUDY MATERIAL: ${studyText}
`;

    const url = "https://openrouter.ai/api/v1/chat/completions";
    const headers = {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
    };
    const body = {
        model: OPENROUTER_MODEL,
        messages: [
            { role: 'system', content: 'You are a helpful quiz generator.' },
            { role: 'user', content: prompt }
        ],
        max_tokens: 2048,
        temperature: 0.6
    };
    let response, data;
    try {
        response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    } catch (fetchErr) {
        throw new Error('Network/API unreachable: ' + (fetchErr?.message || fetchErr));
    }
    if (!response.ok) {
        let errMsg = '';
        try {
            const errData = await response.json();
            errMsg = errData?.error?.message || errData?.error || JSON.stringify(errData);
        } catch {
            errMsg = response.statusText || "Unknown network or API error";
        }
        throw new Error(errMsg);
    }
    try {
        data = await response.json();
    } catch (parseErr) {
        throw new Error("Invalid JSON from OpenRouter: " + (parseErr?.message || parseErr));
    }
    const raw = data.choices?.[0]?.message?.content || '';
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Could not parse AI output.\nRaw Output: ' + raw);
    let questions = [];
    try {
        questions = JSON.parse(jsonMatch[0]);
    } catch (jsonErr) {
        throw new Error('Invalid JSON in AI response: ' + jsonErr.message);
    }
    if (!Array.isArray(questions)) throw new Error("No questions array from AI.");
    return questions.slice(0, numQuestions).map(q => ({ ...q, userAnswer: null }));
}
function renderQuizQuestions(questions) {
    let html = '';
    questions.forEach((q, i) => {
        const optionsHtml = Object.entries(q.options || {}).map(([k, v]) => `
            <div class="quiz-option">
                <input type="radio" id="option-${i}-${k}" name="question-${i}" value="${k}">
                <label for="option-${i}-${k}">${k}. ${escapeHtml(String(v))}</label>
            </div>
        `).join('');
        html += `
        <div class="quiz-question">
            <h4>Question ${q.questionNumber}: ${escapeHtml(q.question)}</h4>
            <div class="quiz-options">${optionsHtml}</div>
            <button class="btn-check-answer" onclick="checkAnswer(${i})">Check Answer</button>
            <div id="result-${i}" class="quiz-result"></div>
        </div>`;
    });
    dom.quizOutput.innerHTML = html;
    window.currentQuestions = questions;
}
function checkAnswer(idx) {
    const q = window.currentQuestions[idx];
    const sel = document.querySelector(`input[name="question-${idx}"]:checked`);
    const div = document.getElementById(`result-${idx}`);
    if (!sel) { div.innerHTML = '<span class="quiz-wrong">Select an answer.</span>'; return; }
    q.userAnswer = sel.value;
    if (q.userAnswer === q.correctAnswer) {
        div.innerHTML = `<span class="quiz-correct">✅ Correct!</span> ${escapeHtml(q.explanation)}`;
    } else {
        div.innerHTML = `<span class="quiz-wrong">❌ Incorrect. Correct answer: ${q.correctAnswer}.</span><br>${escapeHtml(q.explanation)}`;
    }
}
function showQuizLoading() { dom.quizOutput.innerHTML = '<div class="quiz-loading">⏳ Generating questions with AI…</div>'; }
function showQuizError(error) {
    let msg = "";
    if (typeof error === "string") {
        msg = error;
    } else if (error instanceof Error) {
        msg = error.message;
    } else if (typeof error === "object" && error !== null) {
        if (error.error && typeof error.error === "string") {
            msg = error.error;
        } else if (error.message && typeof error.message === "string") {
            msg = error.message;
        } else {
            msg = JSON.stringify(error, null, 2);
        }
    } else {
        msg = String(error);
    }
    dom.quizOutput.innerHTML = `<div class="quiz-error">⚠️ ${escapeHtml(msg)}</div>`;
}

// ======= DASHBOARD & ETC =======
function updateDashboard() {
    dom.totalSubjects.textContent = appState.subjects.length;
    dom.pendingTasks.textContent = appState.tasks.filter(t => !t.completed).length;
    dom.averageMarks.textContent = calculateAverageMarks() + '%';
    dom.totalNotes.textContent = appState.notes.length + ' characters';
    let total = appState.tasks.length, completed = appState.tasks.filter(t => t.completed).length;
    dom.progressBar.value = total ? (completed / total) * 100 : 0;
    dom.progressText.textContent = total ? Math.round((completed / total) * 100) + '%' : '0%';
}
function calculateAverageMarks() {
    let totalScore = 0, totalQuestions = 0;
    appState.quizzes.forEach(quiz => (quiz.questions||[]).forEach(q => {
        if (q.userAnswer) {
            ++totalQuestions;
            if (q.userAnswer === q.correctAnswer) ++totalScore;
        }
    }));
    return totalQuestions === 0 ? 0 : Math.round((totalScore / totalQuestions) * 100);
}
function addActivity(txt) {
    if (!dom.recentActivity) return;
    dom.recentActivity.insertAdjacentHTML('afterbegin',
        `<div class="activity-item"><span>${escapeHtml(txt)}</span> <small>${new Date().toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</small></div>`);
    const items = dom.recentActivity.querySelectorAll('.activity-item');
    if (items.length > 10) items[items.length - 1].remove();
}
function loadAllData() {
    appState.subjects = JSON.parse(localStorage.getItem('subjects')) || [];
    appState.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    appState.notes = localStorage.getItem('notes') || '';
    appState.timetable = JSON.parse(localStorage.getItem('timetable')) || [];
    appState.quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
    renderSubjects(); renderTasks(); renderTimetable(); dom.notesTextarea.value = appState.notes; updateDashboard();
}

// ======= UTILITY =======
function escapeHtml(text) {
    const map = { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// ======= Attach Removal Functions Globally For Buttons =======
window.removeSubject = removeSubject;
window.toggleTask = toggleTask;
window.removeTask = removeTask;
window.removeTimetableEntry = removeTimetableEntry;