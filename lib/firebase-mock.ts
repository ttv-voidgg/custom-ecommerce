// Mock Firebase for v0 preview environment
export const mockFirebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
}

// Mock Firebase services for v0 preview
export const auth = {
  currentUser: null,
  onAuthStateChanged: (callback: any) => {
    // Simulate auth state change
    setTimeout(() => callback(null), 100)
    return () => {}
  },
}

export const db = {
  collection: () => ({
    add: () => Promise.resolve({ id: "mock-doc-id" }),
    get: () => Promise.resolve({ docs: [], empty: true }),
  }),
}

export const app = {
  name: "mock-app",
  options: mockFirebaseConfig,
}

// Mock functions for v0 preview
export const isFirebaseReady = () => true
export const firebaseStatus = {
  app: true,
  auth: true,
  db: true,
  ready: true,
}

// Mock Firebase operations
export const mockOperations = {
  createUser: async (email: string, password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate delay
    return {
      user: {
        uid: "mock-user-id",
        email,
      },
    }
  },

  addDocument: async (collection: string, data: any) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return {
      id: `mock-${collection}-${Date.now()}`,
      ...data,
    }
  },

  getDocuments: async (collection: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return []
  },
}

export default app
