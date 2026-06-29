// ============================================================
// SETTINGS MODULE
// ============================================================
import {
  auth,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
  updateEmail,
  doc,
  getDoc,
  updateDoc
} from '../firebase-config.js';
import { showToast } from './utils.js';

const displayName = document.getElementById('displayName');
const displayEmail = document.getElementById('displayEmail');
const displayPhone = document.getElementById('displayPhone');
const editNameBtn = document.getElementById('editNameBtn');
const changePasswordBtn = document.getElementById('changePasswordBtn');
const logoutBtn = document.getElementById('logoutBtn');
const backBtn = document.getElementById('backBtn');
const themeToggle = document.getElementById('themeToggle');

let user = null;
let userData = {};

// Theme toggle
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

onAuthStateChanged(auth, async (u) => {
  if (!u) {
    window.location.href = 'login.html';
    return;
  }
  user = u;
  displayEmail.textContent = u.email || 'No email';
  try {
    const docSnap = await getDoc(doc(db, 'users', u.uid));
    if (docSnap.exists()) {
      userData = docSnap.data();
      displayName.textContent = userData.name || 'User';
      displayPhone.textContent = userData.phone || 'Not provided';
    }
  } catch (err) {
    console.error('Error loading user data:', err);
  }
});

// Edit name
editNameBtn.addEventListener('click', () => {
  const newName = prompt('Enter your new name:', displayName.textContent);
  if (newName && newName.trim()) {
    updateDoc(doc(db, 'users', user.uid), { name: newName.trim() })
      .then(() => {
        displayName.textContent = newName.trim();
        showToast('Name updated!', 'success');
      })
      .catch(() => showToast('Error updating name.', 'error'));
  }
});

// Change password
changePasswordBtn.addEventListener('click', async () => {
  if (!user) return;
  try {
    await sendPasswordResetEmail(auth, user.email);
    showToast('Password reset email sent.', 'success');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
});

// Logout
logoutBtn.addEventListener('click', async () => {
  if (confirm('Logout?')) {
    await signOut(auth);
    window.location.href = 'index.html';
  }
});

// Back
backBtn.addEventListener('click', () => window.location.href = 'dashboard.html');