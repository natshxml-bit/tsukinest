// features/admin/services/adminActions.ts
// Aksi yang cuma boleh dilakuin admin lewat dashboard: ubah role user lain.
//
// Aman secara server-side karena firestore.rules udah ngizinin admin
// nulis ke dokumen users/{uid} SIAPAPUN (lihat rule `allow update`).
// Kalau yang manggil ini ternyata bukan admin, Firestore bakal nolak
// write-nya sendiri di server — jadi ini gak nambah celah keamanan baru.

import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserRole } from "@/lib/userSync";

export async function setUserRole(uid: string, role: UserRole): Promise<void> {
  const ref = doc(db, "users", uid);
  await setDoc(ref, { role }, { merge: true });
}