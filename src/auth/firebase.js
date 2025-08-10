// src/auth/firebase.js
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'demo',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || 'demo-app-id',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || 'demo',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogleAndSyncProfile() {
  const result = await signInWithPopup(auth, googleProvider);
  const firebaseUser = result.user;
  const profileDoc = doc(db, 'users', firebaseUser.uid);
  const snapshot = await getDoc(profileDoc);
  const additional = result?._tokenResponse || {};

  // Try to derive first/last name
  const fullName = firebaseUser.displayName || '';
  const [possibleFirst, ...rest] = fullName.split(' ');
  const possibleLast = rest.join(' ').trim();
  const firstName = additional.firstName || additional.given_name || possibleFirst || '';
  const lastName = additional.lastName || additional.family_name || possibleLast || '';

  if (!snapshot.exists()) {
    await setDoc(profileDoc, {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      firstName,
      lastName,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  } else {
    // Ensure we have names populated at least once
    const data = snapshot.data();
    if ((!data.firstName || !data.lastName) && (firstName || lastName)) {
      await updateDoc(profileDoc, { firstName, lastName, updatedAt: Date.now() });
    }
  }

  return firebaseUser;
}

export async function signUpWithEmail(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const profileDoc = doc(db, 'users', cred.user.uid);
  await setDoc(profileDoc, {
    uid: cred.user.uid,
    email,
    firstName: '',
    lastName: '',
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  return cred.user;
}

export async function signInWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signOutUser() {
  await signOut(auth);
}

export async function updateProfileName(uid, firstName, lastName) {
  const profileDoc = doc(db, 'users', uid);
  await updateDoc(profileDoc, {
    firstName: firstName || '',
    lastName: lastName || '',
    updatedAt: Date.now()
  });

  // Also update Firebase Auth displayName for consistency
  if (auth.currentUser) {
    const newDisplay = [firstName, lastName].filter(Boolean).join(' ').trim();
    if (newDisplay) {
      await updateProfile(auth.currentUser, { displayName: newDisplay });
    }
  }
}

export async function changePassword(currentPassword, newPassword) {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('No authenticated email user found.');
  }
  // Re-authenticate then change password
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

export async function sendResetEmail(email) {
  await sendPasswordResetEmail(auth, email);
}

export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function getUserProfile(uid) {
  const profileDoc = doc(db, 'users', uid);
  const snapshot = await getDoc(profileDoc);
  return snapshot.exists() ? snapshot.data() : null;
}


