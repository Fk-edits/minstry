// ============================================================
// ADMIN ADD QUESTION MODULE
// ============================================================
import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  collection,
  serverTimestamp
} from '../firebase-config.js';
import { showToast } from './utils.js';

const params = new URLSearchParams(window.location.search);
const editId = params.get('id');

const form = document.getElementById('questionForm');
const saveBtn = document.getElementById('saveBtn');
const backBtn = document.getElementById('backBtn');
const themeToggle = document.getElementById('themeToggle');

// Theme
const isDark = localStorage.getItem('theme') === 'dark';
if (isDark) {
  document.documentElement.setAttribute('data-theme', 'dark');
  themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}
themeToggle.addEventListener('click', () => {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', dark ? 'light' : 'dark');
  localStorage.setItem('theme', dark ? 'light' : 'dark');
  themeToggle.innerHTML = dark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
});

// Populate years
const yearSelect = document.getElementById('yearSelect');
for (let y = 2000; y <= 2030; y++) {
  const opt = document.createElement('option');
  opt.value = y;
  opt.textContent = y;
  yearSelect.appendChild(opt);
}

// Load edit data if id provided
if (editId) {
  loadQuestion(editId);
}

async function loadQuestion(id) {
  try {
    const docSnap = await getDoc(doc(db, 'questions', id));
    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById('gradeSelect').value = data.grade || 'grade8';
      document.getElementById('subjectSelect').value = data.subject || '';
      document.getElementById('yearSelect').value = data.year || '';
      document.getElementById('questionNumber').value = data.questionNumber || '';
      document.getElementById('questionText').value = data.questionText || '';
      document.getElementById('optionA').value = data.options?.[0] || '';
      document.getElementById('optionB').value = data.options?.[1] || '';
      document.getElementById('optionC').value = data.options?.[2] || '';
      document.getElementById('optionD').value = data.options?.[3] || '';
      document.getElementById('correctAnswer').value = data.correctAnswer || '';
      document.getElementById('imageURL').value = data.imageURL || '';
      saveBtn.textContent = 'Update Question';
    }
  } catch (err) {
    showToast('Error loading question', 'error');
  }
}

// Submit
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

  const grade = document.getElementById('gradeSelect').value;
  const subject = document.getElementById('subjectSelect').value;
  const year = parseInt(document.getElementById('yearSelect').value);
  const questionNumber = parseInt(document.getElementById('questionNumber').value);
  const questionText = document.getElementById('questionText').value.trim();
  const options = [
    document.getElementById('optionA').value.trim(),
    document.getElementById('optionB').value.trim(),
    document.getElementById('optionC').value.trim(),
    document.getElementById('optionD').value.trim()
  ];
  const correctAnswer = document.getElementById('correctAnswer').value;
  const imageURL = document.getElementById('imageURL').value.trim() || null;

  if (!subject || !year || !questionText || options.some(o => !o) || !correctAnswer) {
    showToast('Please fill all required fields.', 'warning');
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Question';
    return;
  }

  try {
    const data = {
      grade,
      subject,
      year,
      questionNumber,
      questionText,
      options,
      correctAnswer,
      imageURL,
      updatedAt: serverTimestamp()
    };
    if (editId) {
      await updateDoc(doc(db, 'questions', editId), data);
      showToast('Question updated!', 'success');
    } else {
      await addDoc(collection(db, 'questions'), { ...data, createdAt: serverTimestamp() });
      showToast('Question added!', 'success');
      form.reset();
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Question';
  }
});

// Back
backBtn.addEventListener('click', () => window.location.href = 'admin.html');

// Auth check
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'login.html'; return; }
  const docSnap = await getDoc(doc(db, 'users', user.uid));
  if (!docSnap.exists() || docSnap.data().isAdmin !== true) {
    showToast('Not authorized.', 'error');
    window.location.href = 'dashboard.html';
  }
});