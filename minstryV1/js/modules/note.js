// ============================================================
// NOTES MODULE
// ============================================================
import { db, collection, query, where, getDocs } from '../firebase-config.js';

/**
 * Load notes for a specific grade and subject
 */
export async function loadNotes(grade, subject) {
  try {
    const q = query(
      collection(db, 'notes'),
      where('grade', '==', grade),
      where('subject', '==', subject)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error loading notes:', error);
    return [];
  }
}

/**
 * Render notes into a container
 */
export function renderNotes(container, notes, gradeLabel) {
  if (!container) return;
  if (!notes || notes.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-sticky-note"></i><p>No notes available for this subject.</p></div>`;
    return;
  }
  container.innerHTML = notes.map(note => `
    <div class="note-item">
      <h4>${note.title || 'Note'}</h4>
      <p>${note.content || 'No content'}</p>
      <small>${gradeLabel} • ${note.subject || ''}</small>
    </div>
  `).join('');
}