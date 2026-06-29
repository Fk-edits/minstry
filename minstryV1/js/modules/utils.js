// ============================================================
// UTILITY FUNCTIONS
// ============================================================
export function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => { clearTimeout(timeout); func(...args); };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function getGradeLabel(gradeKey) {
  return gradeKey === 'grade6' ? 'Grade 6' : 'Grade 8';
}

export function getGradeShort(gradeKey) {
  return gradeKey === 'grade6' ? 'G6' : 'G8';
}

export function isCapacitor() {
  return typeof window !== 'undefined' && window.Capacitor !== undefined;
}

export function copyToClipboard(text) {
  if (navigator.clipboard) return navigator.clipboard.writeText(text);
  return new Promise((resolve, reject) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try { document.execCommand('copy'); resolve(); } catch (err) { reject(err); }
    document.body.removeChild(textarea);
  });
}