// ============================================================
// AUTHENTICATION MODULE
// ============================================================
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateEmail,
  updatePassword,
  signOut,
  onAuthStateChanged,
  db,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from '../firebase-config.js';
import { showToast } from './utils.js';

export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Email verification optional – uncomment to enforce
    // if (!user.emailVerified) {
    //   await signOut(auth);
    //   return { success: false, error: 'Please verify your email before logging in.' };
    // }
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function registerUser(name, email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await setDoc(doc(db, 'users', user.uid), {
      name: name,
      email: email,
      isAdmin: false,
      unlockedGrades: [],
      createdAt: serverTimestamp()
    });
    await sendEmailVerification(user);
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getUserData(uid) {
  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (docSnap.exists()) return { success: true, data: docSnap.data() };
    return { success: false, error: 'User not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function isUserAdmin(uid) {
  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (docSnap.exists()) return docSnap.data().isAdmin === true;
    return false;
  } catch { return false; }
}

export function getCurrentUser() {
  return auth.currentUser;
}

export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, callback);
}