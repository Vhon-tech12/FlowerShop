import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD1R7L6UHsJ8tfc2ungHnmPKHDOm1yLKCQ",
  authDomain: "flowershop-system-7cd4b.firebaseapp.com",
  projectId: "flowershop-system-7cd4b",
  storageBucket: "flowershop-system-7cd4b.firebasestorage.app",
  messagingSenderId: "607929138985",
  appId: "1:607929138985:web:1706d4e959340abd228138"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;