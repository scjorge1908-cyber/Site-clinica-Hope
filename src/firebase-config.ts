// Firebase Configuration loaded from environment variables
export const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0489889014",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:452533273828:web:c0f6947d4007b0dc4fd8f1",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCCyjYQCYlV4B45haBbgzcqzQuHbtwolOU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0489889014.firebaseapp.com",
  firestoreDatabaseId: import.meta.env.VITE_FIRESTORE_DATABASE_ID || "ai-studio-7ed6a8a7-416d-4d74-a775-d2997af4a99a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0489889014.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "452533273828",
  measurementId: ""
};
