
import {
  auth,
  db,
  onAuthStateChanged,
  collection,
  addDoc,
  serverTimestamp
} from '../firebase-config.js';
import { showToast } from './utils.js';

const params = new URLSearchParams(window.location.search);
const grade = params.get('grade') || 'grade8';

const confirmBtn = document.getElementById('confirmPaymentBtn');
const statusDiv = document.getElementById('paymentStatus');

let user = null;

onAuthStateChanged(auth, (u) => {
  if (!u) {
    window.location.href = 'login.html';
    return;
  }
  user = u;
});

confirmBtn.addEventListener('click', async () => {
  if (!user) return;
  confirmBtn.disabled = true;
  confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
  try {
    await addDoc(collection(db, 'payments'), {
      userId: user.uid,
      userEmail: user.email,
      grade: grade,
      amount: 300,
      status: 'pending',
      timestamp: serverTimestamp()
    });
    statusDiv.style.display = 'block';
    confirmBtn.innerHTML = '<i class="fas fa-check-circle"></i> Request sent';
    confirmBtn.disabled = true;
  } catch (err) {
    showToast('Error sending payment request.', 'error');
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = '<i class="fas fa-check-circle"></i> I have paid';
  }
});