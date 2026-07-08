import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithCredential, 
  signInWithPopup 
} from "firebase/auth";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { Capacitor } from "@capacitor/core";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// FUNGSI UTAMA: Support Native Capacitor & Web
export const signInWithGoogle = async () => {
  const isCapacitor = Capacitor.isNativePlatform();

  if (isCapacitor) {
    try {
      // 1. Munculkan Native Popup Android (Ga buka Chrome!)
      const result = await FirebaseAuthentication.signInWithGoogle();
      
      // 2. Ambil token dari hasil login native
      const idToken = result.credential?.idToken;
      if (!idToken) throw new Error("ID Token tidak ditemukan dari native provider");

      // 3. PENTING: Setor token ke Firebase SDK biar UI aplikasi lu update statusnya
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      
      return userCredential.user;
    } catch (error) {
      console.error("Native Google Sign-In Error:", error);
      throw error;
    }
  } else {
    // 4. Fallback ke Web SDK (tetap buka popup Chrome kalau di PC)
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error("Web Google Sign-In Error:", error);
      throw error;
    }
  }
};

export { app };
