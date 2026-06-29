// ============================================================
// EXAM MODULE
// ============================================================
import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy
} from '../firebase-config.js';
import { showToast } from './utils.js';

// ============================================================
// STATE
// ============================================================
const params = new URLSearchParams(window.location.search);
const grade = params.get('grade') || 'grade8';
const subject = params.get('subject') || 'Mathematics';

let questions = [];
let currentIndex = 0;
let selectedAnswers = {};
let timeLeft = 3600; // 1 hour
let timerInterval = null;
let isSubmitted = false;
let userUnlocked = false;
let showCorrectAnswer = localStorage.getItem('showCorrectAnswer') === 'rightaway';

const gradeLabel = grade === 'grade6' ? 'G6' : 'G8';

// ============================================================
// DOM REFS
// ============================================================
const $ = id => document.getElementById(id);
const examTitle = $('examTitle');
const questionText = $('questionText');
const optionsContainer = $('optionsContainer');
const passageContainer = $('passageContainer');
const passageText = $('passageText');
const prevBtn = $('prevBtn');
const nextBtn = $('nextBtn');
const submitBtn = $('submitBtn');
const submitSection = $('submitSection');
const timerDisplay = $('timerDisplay');
const progressFill = $('progressFill');
const progressText = $('progressText');
const resultContainer = $('resultContainer');
const resultSummary = $('resultSummary');
const resultDetails = $('resultDetails');
const backBtn = $('backBtn');
const resultBackBtn = $('resultBackBtn');

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  if (examTitle) examTitle.textContent = `${subject} ${gradeLabel}`;
  initExam();
});

async function initExam() {
  const user = auth.currentUser;
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      userUnlocked = (data.unlockedGrades || []).includes(grade);
    }
  } catch (err) {
    console.error('Error checking user:', err);
  }
  await loadQuestions();
  renderQuestion();
  startTimer();
}

// ============================================================
// LOAD QUESTIONS
// ============================================================
async function loadQuestions() {
  try {
    const q = query(
      collection(db, 'questions'),
      where('grade', '==', grade),
      where('subject', '==', subject),
      orderBy('questionNumber', 'asc')
    );
    const snap = await getDocs(q);
    questions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (questions.length === 0) {
      questions = generateMockQuestions();
    }
    if (!userUnlocked) {
      questions = questions.slice(0, 3);
    }
  } catch (err) {
    console.error('Error loading questions:', err);
    questions = generateMockQuestions();
    if (!userUnlocked) {
      questions = questions.slice(0, 3);
    }
  }
  if (progressText) {
    progressText.textContent = `Question 1 of ${questions.length}`;
  }
  // Show free tier banner
  if (!userUnlocked && questions.length > 0) {
    const container = document.querySelector('.exam-container');
    if (container && !container.querySelector('.free-banner')) {
      const banner = document.createElement('div');
      banner.className = 'free-banner';
      banner.style.cssText = `
        background: var(--warning-light);
        color: var(--warning);
        padding: 0.7rem 1rem;
        border-radius: var(--radius-sm);
        font-size: 0.85rem;
        font-weight: 500;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      `;
      banner.innerHTML = `
        <i class="fas fa-info-circle"></i>
        Free trial – only ${questions.length} questions.
        <a href="payment.html?grade=${grade}" style="color: var(--accent); text-decoration: underline;">Unlock all</a>
      `;
      container.prepend(banner);
    }
  }
}

function generateMockQuestions() {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `q${i+1}`,
    questionText: `Sample question ${i+1}: What is 2 + 2?`,
    passage: i % 2 === 0 ? `Read this passage for question ${i+1}.` : null,
    options: ['3', '4', '5', '6'],
    correctAnswer: 1
  }));
}

// ============================================================
// RENDER QUESTION
// ============================================================
function renderQuestion() {
  if (!questionText || !optionsContainer) return;
  if (questions.length === 0) {
    questionText.textContent = 'No questions available.';
    optionsContainer.innerHTML = '';
    return;
  }

  const q = questions[currentIndex];
  const total = questions.length;

  if (passageContainer && passageText) {
    if (q.passage) {
      passageContainer.style.display = 'block';
      passageText.textContent = q.passage;
    } else {
      passageContainer.style.display = 'none';
    }
  }

  questionText.textContent = q.questionText || 'Question text missing';

  optionsContainer.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D'];
  q.options.forEach((opt, idx) => {
    const optDiv = document.createElement('div');
    optDiv.className = 'option';
    const selected = selectedAnswers[q.id] === idx;
    if (selected) optDiv.classList.add('selected');

    if (isSubmitted) {
      optDiv.classList.add('disabled');
      if (idx === q.correctAnswer) optDiv.classList.add('correct');
      else if (selected && idx !== q.correctAnswer) optDiv.classList.add('wrong');
    } else {
      if (showCorrectAnswer && selected) {
        if (idx === q.correctAnswer) optDiv.classList.add('correct');
        else optDiv.classList.add('wrong');
        optDiv.classList.add('disabled');
      }
    }

    optDiv.innerHTML = `
      <span class="letter">${letters[idx]}</span>
      <span class="text">${opt}</span>
    `;
    optDiv.addEventListener('click', () => handleOptionClick(q.id, idx));
    optionsContainer.appendChild(optDiv);
  });

  if (progressFill && progressText) {
    progressFill.style.width = `${((currentIndex + 1) / total) * 100}%`;
    progressText.textContent = `Question ${currentIndex + 1} of ${total}`;
  }

  if (prevBtn) prevBtn.disabled = currentIndex === 0;
  if (nextBtn && submitSection) {
    if (currentIndex === total - 1) {
      nextBtn.style.display = 'none';
      submitSection.style.display = 'block';
    } else {
      nextBtn.style.display = 'inline-flex';
      submitSection.style.display = 'none';
    }
  }
}

// ============================================================
// OPTION CLICK
// ============================================================
function handleOptionClick(questionId, selectedIndex) {
  if (isSubmitted) return;
  const q = questions.find(item => item.id === questionId);
  if (!q) return;

  if (showCorrectAnswer) {
    selectedAnswers[questionId] = selectedIndex;
    renderQuestion();
    return;
  }

  if (selectedAnswers[questionId] === selectedIndex) {
    delete selectedAnswers[questionId];
  } else {
    selectedAnswers[questionId] = selectedIndex;
  }
  renderQuestion();
}

// ============================================================
// NAVIGATION
// ============================================================
if (prevBtn) {
  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      renderQuestion();
    }
  });
}
if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    if (currentIndex < questions.length - 1) {
      currentIndex++;
      renderQuestion();
    }
  });
}
if (submitBtn) {
  submitBtn.addEventListener('click', submitExam);
}

// ============================================================
// TIMER
// ============================================================
function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      alert('Time is up! Submitting your exam.');
      submitExam();
    }
  }, 1000);
}

function updateTimerDisplay() {
  if (!timerDisplay) return;
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  timerDisplay.innerHTML = `<i class="fas fa-clock"></i> ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ============================================================
// SUBMIT EXAM
// ============================================================
function submitExam() {
  if (isSubmitted) return;
  clearInterval(timerInterval);
  isSubmitted = true;

  let correct = 0;
  const details = questions.map(q => {
    const userAns = selectedAnswers[q.id];
    const isCorrect = userAns === q.correctAnswer;
    if (isCorrect) correct++;
    return {
      question: q.questionText,
      userAnswer: userAns !== undefined ? q.options[userAns] : 'Not answered',
      correctAnswer: q.options[q.correctAnswer],
      isCorrect
    };
  });

  const total = questions.length;
  const percentage = Math.round((correct / total) * 100);

  if (resultSummary) {
    resultSummary.innerHTML = `
      <div class="score">${correct}/${total}</div>
      <div class="label">${percentage}% Correct</div>
      <div style="margin-top:8px; color:${percentage >= 70 ? 'var(--success)' : 'var(--danger)'};">
        ${percentage >= 70 ? '🎉 Excellent!' : '💪 Keep practicing!'}
      </div>
    `;
  }

  if (resultDetails) {
    resultDetails.innerHTML = details.map((d, i) => `
      <div class="result-item">
        <span class="q">Q${i+1}: ${d.question}</span>
        <span class="status ${d.isCorrect ? 'correct' : 'wrong'}">${d.isCorrect ? '✅ Correct' : '❌ Wrong'}</span>
      </div>
    `).join('');
  }

  const questionCard = document.getElementById('questionCard');
  if (questionCard) questionCard.style.display = 'none';
  if (submitSection) submitSection.style.display = 'none';
  if (resultContainer) resultContainer.style.display = 'block';
  if (progressText) progressText.textContent = 'Exam completed';
}

// ============================================================
// BACK BUTTONS
// ============================================================
if (backBtn) {
  backBtn.addEventListener('click', () => {
    if (isSubmitted) {
      window.location.href = 'dashboard.html';
    } else if (confirm('Are you sure you want to leave? Your progress will be lost.')) {
      window.location.href = 'dashboard.html';
    }
  });
}
if (resultBackBtn) {
  resultBackBtn.addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });
}

// ============================================================
// AUTH
// ============================================================
onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = 'login.html';
});