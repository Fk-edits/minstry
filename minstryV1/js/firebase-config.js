// js/firebase-config.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateEmail,
  updatePassword
} from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
  onSnapshot  // 👈 ADDED
} from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyAeUSVGA6FclpcEFlzryjnXAItXrW8FReo",
  authDomain: "matrix-7d63c.firebaseapp.com",
  projectId: "matrix-7d63c",
  storageBucket: "matrix-7d63c.firebasestorage.app",
  messagingSenderId: "798324364503",
  appId: "1:798324364503:web:43e7dd59476f2cb3aecc92"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  auth,
  db,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateEmail,
  updatePassword,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
  onSnapshot  // 👈 EXPORTED
};