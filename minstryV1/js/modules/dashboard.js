// ============================================================
// DASHBOARD MODULE – Complete
// ============================================================
import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  getDoc,
  updateDoc,
  signOut,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
  sendPasswordResetEmail
} from '../firebase-config.js';
import { formatDate, getInitials, showToast, getGradeLabel, getGradeShort } from './utils.js';
import { getTranslation } from './languages.js';

// SUBJECTS
const SUBJECTS = [
  { name: 'Mathematics', icon: 'fa-calculator' },
  { name: 'General Science', icon: 'fa-flask' },
  { name: 'Social Science', icon: 'fa-globe' },
  { name: 'Sidamo Afoo', icon: 'fa-book-open' },
  { name: 'English', icon: 'fa-language' },
  { name: 'Amharic', icon: 'fa-eye' },
  { name: 'Citizenship', icon: 'fa-shield-alt' }
];

let currentGrade = '8';
let userData = {};
let currentUser = null;
let paymentPending = false;
let unsubscribeUser = null;

// DOM REFS
const $ = id => document.getElementById(id);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const grid = $('subjectGrid');
const notesView = $('notesView');
const unlockBtn = $('unlockAllBtn');
const gradeBtns = qsa('.grade-btn');
const menuBtn = $('menuBtn');
const sidebar = $('sidebarDrawer');
const overlay = $('sidebarOverlay');
const closeBtn = $('sidebarClose');
const profileBtn = $('profileBtn');
const sidebarProfile = $('sidebarProfile');
const examNav = $('examNav');
const notesNav = $('notesNav');
const refreshBtn = $('refreshSubjects');
const shareBtn = $('shareApp');
const themeToggle = $('themeToggle');

// Profile
const profileModal = $('profileModal');
const modalAvatar = $('modalAvatar');
const modalName = $('modalName');
const modalEmail = $('modalEmail');
const profileNameDisplay = $('profileNameDisplay');
const profileEmailDisplay = $('profileEmailDisplay');
const profilePhoneDisplay = $('profilePhoneDisplay');
const profileGrade6 = $('profileGrade6');
const profileGrade8 = $('profileGrade8');
const profileEditName = $('profileEditName');
const profileNameEdit = $('profileNameEdit');
const profileNameInput = $('profileNameInput');
const profileSaveName = $('profileSaveName');
const changePasswordBtn = $('changePasswordBtn');
const logoutBtn = $('logoutBtn');
const profileModalClose = $('profileModalClose');

// Payment
const paymentModal = $('paymentModal');
const paymentGradeDisplay = $('paymentGradeDisplay');
const confirmPaymentBtn = $('confirmPaymentBtn');
const paymentStatus = $('paymentStatus');
const paymentModalClose = $('paymentModalClose');

// ============================================================
// THEME
// ============================================================
const isDark = localStorage.getItem('theme') === 'dark';
if (isDark && themeToggle) {
  document.documentElement.setAttribute('data-theme', 'dark');
  themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', dark ? 'light' : 'dark');
    localStorage.setItem('theme', dark ? 'light' : 'dark');
    themeToggle.innerHTML = dark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
  });
}

// ============================================================
// HELPERS
// ============================================================
function getGradeKey() { return `grade${currentGrade}`; }
function getGradeLabelShort() { return currentGrade === '6' ? 'G6' : 'G8'; }

// ============================================================
// SIDEBAR
// ============================================================
function closeSidebar() {
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  if (overlay) overlay.style.display = 'none';
}
function openSidebar() {
  if (sidebar) sidebar.classList.add('open');
  if (overlay) overlay.classList.add('open');
  if (overlay) overlay.style.display = 'block';
}
if (menuBtn) menuBtn.addEventListener('click', openSidebar);
if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
if (overlay) overlay.addEventListener('click', closeSidebar);

// ============================================================
// MODALS
// ============================================================
function openModal(modal) { if (modal) modal.classList.add('open'); }
function closeModal(modal) { if (modal) modal.classList.remove('open'); }

if (profileBtn) profileBtn.addEventListener('click', () => { closeSidebar(); openModal(profileModal); });
if (sidebarProfile) sidebarProfile.addEventListener('click', () => { closeSidebar(); openModal(profileModal); });
if (profileModalClose) profileModalClose.addEventListener('click', () => closeModal(profileModal));
if (profileModal) profileModal.addEventListener('click', (e) => { if (e.target === profileModal) closeModal(profileModal); });
if (paymentModalClose) paymentModalClose.addEventListener('click', () => closeModal(paymentModal));
if (paymentModal) paymentModal.addEventListener('click', (e) => { if (e.target === paymentModal) closeModal(paymentModal); });

// ============================================================
// VIEW TOGGLING
// ============================================================
function showExam() {
  if (grid) grid.style.display = 'grid';
  if (notesView) notesView.style.display = 'none';
  if (examNav) examNav.classList.add('active');
  if (notesNav) notesNav.classList.remove('active');
}
function showNotes() {
  if (grid) grid.style.display = 'none';
  if (notesView) notesView.style.display = 'grid';
  if (notesNav) notesNav.classList.add('active');
  if (examNav) examNav.classList.remove('active');
  renderNotes();
}
if (examNav) examNav.addEventListener('click', showExam);
if (notesNav) notesNav.addEventListener('click', showNotes);

// ============================================================
// RENDER SUBJECTS
// ============================================================
function renderSubjects() {
  if (!grid) return;
  const gradeKey = getGradeKey();
  const unlocked = (userData.unlockedGrades || []).includes(gradeKey);
  const gradeLabel = getGradeLabelShort();

  const freeExamText = getTranslation('contains_free_exam', 'Contains free exam');
  const lockedText = getTranslation('locked', 'Locked');

  grid.innerHTML = SUBJECTS.map(sub => {
    const lockIcon = unlocked
      ? '<i class="fas fa-lock-open" style="color:var(--success);"></i>'
      : '<i class="fas fa-lock" style="color:var(--danger);"></i>';
    const statusClass = unlocked ? '' : 'locked';
    const statusText = unlocked ? freeExamText : `<i class="fas fa-lock"></i> ${lockedText}`;
    return `
      <div class="subject-card" data-subject="${sub.name}">
        <div class="lock-icon">${lockIcon}</div>
        <i class="${sub.icon} sub-icon"></i>
        <div class="sub-name">${sub.name} ${gradeLabel}</div>
        <div class="sub-status ${statusClass}">${statusText}</div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.subject-card').forEach(card => {
    card.addEventListener('click', () => {
      const subject = card.dataset.subject;
      window.location.href = `exam.html?grade=${gradeKey}&subject=${encodeURIComponent(subject)}`;
    });
  });

  if (unlockBtn) {
    if (unlocked) {
      unlockBtn.innerHTML = '<i class="fas fa-check-circle"></i> ' + getTranslation('unlocked', 'Unlocked');
      unlockBtn.style.background = 'var(--success)';
      unlockBtn.disabled = true;
    } else {
      unlockBtn.innerHTML = '<i class="fas fa-lock"></i> ' + getTranslation('unlock_all', 'Unlock All – 300 Birr');
      unlockBtn.style.background = 'var(--accent)';
      unlockBtn.disabled = false;
    }
  }
}

// ============================================================
// RENDER NOTES
// ============================================================
function renderNotes() {
  if (!notesView) return;
  const gradeKey = getGradeKey();
  const unlocked = (userData.unlockedGrades || []).includes(gradeKey);
  const gradeLabel = getGradeLabelShort();

  const freeNotesText = getTranslation('contains_free_notes', 'Contains free notes');
  const lockedText = getTranslation('locked', 'Locked');

  const noteSubjects = [
    { name: 'General Science', icon: 'flask' },
    { name: 'Mathematics', icon: 'calculator' },
    { name: 'Social Science', icon: 'globe' },
    { name: 'Sidamo Afoo', icon: 'book-open' },
    { name: 'English', icon: 'language' },
    { name: 'Amharic', icon: 'eye' },
    { name: 'Citizenship', icon: 'shield-alt' }
  ];

  notesView.innerHTML = noteSubjects.map(sub => {
    const statusClass = unlocked ? 'unlocked' : 'locked';
    const statusText = unlocked ? `✅ ${freeNotesText}` : `🔒 ${lockedText}`;
    return `
      <div class="note-card" data-subject="${sub.name}" data-grade="${gradeKey}" style="cursor:pointer;">
        <i class="fas fa-${sub.icon}"></i>
        <div class="name">${sub.name} ${gradeLabel}</div>
        <div class="status ${statusClass}">${statusText}</div>
      </div>
    `;
  }).join('');

  // Make note cards clickable → open note.html
  notesView.querySelectorAll('.note-card').forEach(card => {
    card.addEventListener('click', () => {
      const subject = card.dataset.subject;
      const grade = card.dataset.grade;
      window.location.href = `note.html?grade=${grade}&subject=${encodeURIComponent(subject)}`;
    });
  });
}

// ============================================================
// GRADE TOGGLE
// ============================================================
gradeBtns.forEach(btn => {
  btn.addEventListener('click', function() {
    gradeBtns.forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    currentGrade = this.dataset.grade;
    if (paymentGradeDisplay) paymentGradeDisplay.textContent = `Grade ${currentGrade}`;
    renderSubjects();
    if (notesView && notesView.style.display !== 'none') renderNotes();
  });
});

// ============================================================
// UNLOCK BUTTON
// ============================================================
if (unlockBtn) {
  unlockBtn.addEventListener('click', () => {
    if (paymentGradeDisplay) paymentGradeDisplay.textContent = `Grade ${currentGrade}`;
    if (paymentStatus) paymentStatus.style.display = 'none';
    if (confirmPaymentBtn) {
      confirmPaymentBtn.disabled = false;
      confirmPaymentBtn.innerHTML = '<i class="fas fa-check-circle"></i> ' + getTranslation('i_have_paid', 'I have paid');
    }
    openModal(paymentModal);
  });
}

// ============================================================
// PAYMENT CONFIRMATION (with choices)
// ============================================================
if (confirmPaymentBtn) {
  confirmPaymentBtn.addEventListener('click', async () => {
    if (paymentPending || !currentUser) return;
    paymentPending = true;
    confirmPaymentBtn.disabled = true;
    confirmPaymentBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + getTranslation('sending', 'Sending...');

    try {
      const gradeKey = getGradeKey();
      await addDoc(collection(db, 'payments'), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        grade: gradeKey,
        amount: 300,
        status: 'pending',
        timestamp: serverTimestamp()
      });
      if (paymentStatus) paymentStatus.style.display = 'block';
      confirmPaymentBtn.innerHTML = '<i class="fas fa-check-circle"></i> ' + getTranslation('request_sent', 'Request sent');
      confirmPaymentBtn.disabled = true;
      setTimeout(() => {
        closeModal(paymentModal);
        confirmPaymentBtn.disabled = false;
        confirmPaymentBtn.innerHTML = '<i class="fas fa-check-circle"></i> ' + getTranslation('i_have_paid', 'I have paid');
        paymentPending = false;
      }, 3000);
    } catch (err) {
      console.error('Payment error:', err);
      showToast(getTranslation('payment_error', 'Error sending payment request.'), 'error');
      confirmPaymentBtn.disabled = false;
      confirmPaymentBtn.innerHTML = '<i class="fas fa-check-circle"></i> ' + getTranslation('i_have_paid', 'I have paid');
      paymentPending = false;
    }
  });
}

// ============================================================
// PROFILE
// ============================================================
function updateProfileUI(user, data) {
  const name = data.name || 'User';
  const email = user.email || 'No email';
  const phone = data.phone || 'Not provided';
  const unlocked = data.unlockedGrades || [];

  const initials = getInitials(name);
  if (modalAvatar) modalAvatar.textContent = initials || 'U';
  if (modalName) modalName.textContent = name;
  if (modalEmail) modalEmail.textContent = email;
  if (profileNameDisplay) profileNameDisplay.textContent = name;
  if (profileEmailDisplay) profileEmailDisplay.textContent = email;
  if (profilePhoneDisplay) profilePhoneDisplay.textContent = phone;

  const g6 = unlocked.includes('grade6');
  const g8 = unlocked.includes('grade8');
  if (profileGrade6) {
    profileGrade6.textContent = `Grade 6: ${g6 ? '✅ ' + getTranslation('unlocked', 'Unlocked') : '🔒 ' + getTranslation('locked', 'Locked')}`;
    profileGrade6.className = `status-badge ${g6 ? 'unlocked' : 'locked'}`;
  }
  if (profileGrade8) {
    profileGrade8.textContent = `Grade 8: ${g8 ? '✅ ' + getTranslation('unlocked', 'Unlocked') : '🔒 ' + getTranslation('locked', 'Locked')}`;
    profileGrade8.className = `status-badge ${g8 ? 'unlocked' : 'locked'}`;
  }
}

// Edit name
if (profileEditName) {
  profileEditName.addEventListener('click', () => {
    if (profileNameInput) profileNameInput.value = profileNameDisplay ? profileNameDisplay.textContent : '';
    if (profileNameDisplay && profileNameDisplay.parentElement) {
      profileNameDisplay.parentElement.style.display = 'none';
    }
    if (profileEditName) profileEditName.style.display = 'none';
    if (profileNameEdit) profileNameEdit.style.display = 'flex';
  });
}
if (profileSaveName) {
  profileSaveName.addEventListener('click', async () => {
    const newName = profileNameInput ? profileNameInput.value.trim() : '';
    if (!newName || !currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { name: newName });
      userData.name = newName;
      updateProfileUI(currentUser, userData);
      if (profileNameDisplay && profileNameDisplay.parentElement) {
        profileNameDisplay.parentElement.style.display = 'flex';
      }
      if (profileEditName) profileEditName.style.display = 'block';
      if (profileNameEdit) profileNameEdit.style.display = 'none';
      renderSubjects();
      if (notesView && notesView.style.display !== 'none') renderNotes();
    } catch (err) {
      showToast(getTranslation('name_update_failed', 'Failed to update name.'), 'error');
    }
  });
}

// Change password
if (changePasswordBtn) {
  changePasswordBtn.addEventListener('click', async () => {
    if (!currentUser || !currentUser.email) return;
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      showToast(getTranslation('password_reset_sent', 'Password reset email sent!'), 'success');
    } catch (err) {
      showToast(getTranslation('error', 'Error: ') + err.message, 'error');
    }
  });
}

// Logout
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    if (confirm(getTranslation('logout_confirm', 'Are you sure you want to logout?'))) {
      try {
        await signOut(auth);
        window.location.href = 'index.html';
      } catch (err) {
        showToast(getTranslation('logout_failed', 'Logout failed.'), 'error');
      }
    }
  });
}

// ============================================================
// REFRESH & SHARE
// ============================================================
if (refreshBtn) {
  refreshBtn.addEventListener('click', () => {
    renderSubjects();
    if (notesView && notesView.style.display !== 'none') renderNotes();
    closeSidebar();
  });
}
if (shareBtn) {
  shareBtn.addEventListener('click', () => {
    if (navigator.share) {
      navigator.share({ title: 'Ethio Ministry', text: getTranslation('share_text', 'Prepare for national exams!') });
    } else {
      showToast(getTranslation('share_unavailable', 'Share feature not available on this device.'), 'info');
    }
  });
}

// ============================================================
// AUTH & INIT – with real-time user listener
// ============================================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  currentUser = user;
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      userData = userDoc.data();
    } else {
      userData = { name: user.displayName || 'User', phone: '', unlockedGrades: [] };
      await setDoc(userRef, userData);
    }
    updateProfileUI(user, userData);
    renderSubjects();
    renderNotes();

    // Real‑time listener for unlockedGrades changes (admin approval)
    if (unsubscribeUser) unsubscribeUser();
    unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const newData = docSnap.data();
        // Check if unlockedGrades changed
        const oldUnlocked = userData.unlockedGrades || [];
        const newUnlocked = newData.unlockedGrades || [];
        if (JSON.stringify(oldUnlocked) !== JSON.stringify(newUnlocked)) {
          userData = newData;
          updateProfileUI(currentUser, userData);
          renderSubjects();
          renderNotes();
          showToast(getTranslation('grades_unlocked', 'Your grades have been unlocked!'), 'success');
        } else {
          userData = newData;
        }
      }
    });
  } catch (err) {
    console.error('Error loading user data:', err);
    showToast(getTranslation('profile_load_error', 'Error loading profile.'), 'error');
  }
});

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (sidebar && sidebar.classList.contains('open')) closeSidebar();
    if (profileModal && profileModal.classList.contains('open')) closeModal(profileModal);
    if (paymentModal && paymentModal.classList.contains('open')) closeModal(paymentModal);
  }
});

// Import onSnapshot for real‑time
import { onSnapshot } from '../firebase-config.js';