import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// Validate Firebase configuration
const requiredEnvVars = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
]

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName])
if (missingVars.length > 0) {
  console.error("Missing required Firebase environment variables:", missingVars)
}

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase app
let app
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  console.log("Firebase app initialized successfully")
} catch (error) {
  console.error("Error initializing Firebase app:", error)
  throw new Error(`Firebase initialization failed: ${error}`)
}

// Initialize Firebase services
let auth
let db

try {
  // Initialize Auth first
  auth = getAuth(app)
  console.log("Firebase Auth initialized successfully")

  // Initialize Firestore
  db = getFirestore(app)
  console.log("Firebase Firestore initialized successfully")
} catch (error) {
  console.error("Error initializing Firebase services:", error)
  throw new Error(`Firebase services initialization failed: ${error}`)
}

// Validate that services are properly initialized
if (!auth) {
  throw new Error("Firebase Auth failed to initialize")
}

if (!db) {
  throw new Error("Firebase Firestore failed to initialize")
}

console.log("All Firebase services initialized successfully")

// Export initialized services
export { auth, db, app }
export default app

// Export a function to check if Firebase is ready
export const isFirebaseReady = () => {
  return !!(auth && db && app)
}

// Export initialization status
export const firebaseStatus = {
  app: !!app,
  auth: !!auth,
  db: !!db,
  ready: isFirebaseReady(),
}
