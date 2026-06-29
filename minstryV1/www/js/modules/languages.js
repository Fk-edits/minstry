// ============================================================
// LANGUAGES MODULE – i18n
// ============================================================
let currentLang = localStorage.getItem('lang') || 'en';
let translations = {};

export async function loadLanguage(lang = currentLang) {
  try {
    const res = await fetch(`/locales/${lang}.json`);
    if (!res.ok) throw new Error('Language file not found');
    translations = await res.json();
    currentLang = lang;
    localStorage.setItem('lang', lang);
    applyTranslations();
    return translations;
  } catch (err) {
    console.warn('Error loading language:', err);
    if (lang !== 'en') return loadLanguage('en');
    return {};
  }
}

export function getTranslation(key, fallback = key) {
  return translations[key] || fallback;
}

export function setLanguage(lang) {
  if (lang === currentLang) return;
  loadLanguage(lang);
}

export function getCurrentLanguage() {
  return currentLang;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = getTranslation(key);
    if (translation) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = translation;
      } else {
        el.textContent = translation;
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadLanguage(currentLang);
});