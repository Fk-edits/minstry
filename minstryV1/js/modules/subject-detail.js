// ============================================================
// SUBJECT DETAIL MODULE
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
  getDocs
} from '../firebase-config.js';
import { showToast } from './utils.js';

const params = new URLSearchParams(window.location.search);
const grade = params.get('grade') || 'grade8';
const subject = params.get('subject') || 'Mathematics';

let currentYear = null;
let units = [];
let userUnlocked = false;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('subjectTitle').textContent = subject;
  initDetail();
});

async function initDetail() {
  const user = auth.currentUser;
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      userUnlocked = (userDoc.data().unlockedGrades || []).includes(grade);
    }
  } catch (err) {
    console.error('Error checking user:', err);
  }
  await loadUnits();
  renderYearTabs();
  if (currentYear) renderUnits();
  renderUnlockCard();
}

async function loadUnits() {
  try {
    const q = query(
      collection(db, 'questions'),
      where('grade', '==', grade),
      where('subject', '==', subject)
    );
    const snap = await getDocs(q);
    const questions = snap.docs.map(d => d.data());
    // Group by year
    const yearMap = {};
    questions.forEach(q => {
      if (!yearMap[q.year]) yearMap[q.year] = [];
      yearMap[q.year].push(q);
    });
    units = Object.keys(yearMap).map(year => ({
      year: parseInt(year),
      questions: yearMap[year]
    }));
    units.sort((a,b) => a.year - b.year);
    if (units.length > 0) {
      currentYear = units[0].year;
    }
  } catch (err) {
    console.error('Error loading units:', err);
    // Mock data
    units = [
      { year: 2014, questions: [{ unit: 1 }, { unit: 2 }, { unit: 3 }] },
      { year: 2015, questions: [{ unit: 1 }] }
    ];
    currentYear = units[0].year;
  }
}

function renderYearTabs() {
  const container = document.getElementById('yearTabs');
  if (!container) return;
  container.innerHTML = units.map(u => `
    <button class="year-tab ${u.year === currentYear ? 'active' : ''}" data-year="${u.year}">
      ${u.year}
    </button>
  `).join('');
  container.querySelectorAll('.year-tab').forEach(btn => {
    btn.addEventListener('click', function() {
      currentYear = parseInt(this.dataset.year);
      renderYearTabs();
      renderUnits();
      renderUnlockCard();
    });
  });
}

function renderUnits() {
  const container = document.getElementById('unitsList');
  if (!container) return;
  const yearData = units.find(u => u.year === currentYear);
  if (!yearData) {
    container.innerHTML = '<div class="empty-state">No units found for this year.</div>';
    return;
  }
  // Assume each question has a unit number; we'll group unique units
  const unitSet = new Set();
  yearData.questions.forEach(q => {
    if (q.unit) unitSet.add(q.unit);
  });
  const unitList = Array.from(unitSet).sort();
  if (unitList.length === 0) {
    container.innerHTML = '<div class="empty-state">No units available.</div>';
    return;
  }
  const unlocked = userUnlocked;
  container.innerHTML = unitList.map((unit, idx) => `
    <div class="unit-item">
      <span class="name">Unit ${unit}</span>
      <div class="info">
        ${unlocked ? `<span class="unlock-icon"><i class="fas fa-lock-open"></i></span>` : `<span class="lock-icon"><i class="fas fa-lock"></i></span>`}
        <span class="count">${yearData.questions.filter(q => q.unit === unit).length} questions</span>
      </div>
    </div>
  `).join('');
}

function renderUnlockCard() {
  const container = document.getElementById('unlockCard');
  if (!container) return;
  const unlocked = userUnlocked;
  if (unlocked) {
    container.style.display = 'none';
    return;
  }
  container.style.display = 'block';
  document.getElementById('unlockSubject').textContent = subject;
  document.getElementById('unlockYear').textContent = currentYear || '';
  document.getElementById('unlockDownloadBtn').addEventListener('click', () => {
    window.location.href = `payment.html?grade=${grade}&subject=${encodeURIComponent(subject)}`;
  });
}

onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = 'login.html';
});