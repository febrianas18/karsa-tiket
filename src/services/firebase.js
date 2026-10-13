import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || 'AIzaSyDgtVIujjBJYs2MvbddFTJex4GOqhw1SPM',
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || 'karsa-tiket-d8a22.firebaseapp.com',
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || 'karsa-tiket-d8a22',
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || 'karsa-tiket-d8a22.firebasestorage.app',
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '505659568617',
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || '1:505659568617:web:2a38a1936b871c2cb91b78',
  measurementId: import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID || 'G-RSVW2CPY33'
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'YOUR_API_KEY'
)

// Inisialisasi Firebase App (singleton)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
const db = getFirestore(app)

export { app, db, firebaseConfig }
export default db
