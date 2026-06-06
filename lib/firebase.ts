import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// Ini yang baru: import modul Auth sama Google Provider
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Trik Next.js: Cek dulu app-nya udah ada belum biar gak error pas hot reload
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Inisialisasi Firestore (Database buat nyimpen Library)
const db = getFirestore(app);

// Inisialisasi Auth (Buat Login Profile)
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Jangan lupa di-export biar bisa dipanggil di halaman lain
export { app, db, auth, googleProvider };
