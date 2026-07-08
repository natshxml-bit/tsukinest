import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Function buat Google Sign-In yang support Capacitor
export const signInWithGoogle = async () => {
  // Check if running in Capacitor
  const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform();
  
  if (isCapacitor) {
    // Pakai native Google Sign-In untuk Capacitor
    try {
      const result = await FirebaseAuthentication.signInWithGoogle();
      return result.user;
    } catch (error) {
      console.error("Google sign in error:", error);
      throw error;
    }
  } else {
    // Pakai Firebase Auth biasa untuk web
    const { signInWithPopup } = await import("firebase/auth");
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  }
};

export { app, db, auth, googleProvider };