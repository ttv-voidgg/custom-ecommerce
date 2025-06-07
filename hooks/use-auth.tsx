"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface AuthContextType {
  user: any | null
  isAdmin: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: any) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

// Admin emails from environment variable
const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",") || ["juancarlos.deborja@gmail.com"]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authInitialized, setAuthInitialized] = useState(false)

  useEffect(() => {
    // Dynamically import Firebase Auth to avoid SSR issues
    const initAuth = async () => {
      try {
        const { auth } = await import("@/lib/firebase")
        const { onAuthStateChanged } = await import("firebase/auth")
        const { collection, query, where, getDocs } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase")

        if (!auth) {
          console.error("Firebase Auth not initialized")
          setLoading(false)
          setAuthInitialized(true)
          return
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            // Get additional user data from Firestore
            try {
              const userRef = collection(db, "users")
              const q = query(userRef, where("uid", "==", firebaseUser.uid))
              const querySnapshot = await getDocs(q)

              let userData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                firstName: "",
                lastName: "",
                isAdmin: false,
              }

              if (!querySnapshot.empty) {
                const firestoreData = querySnapshot.docs[0].data()
                userData = {
                  ...userData,
                  firstName: firestoreData.firstName || "",
                  lastName: firestoreData.lastName || "",
                  isAdmin: firestoreData.isAdmin === true,
                }
              }

              // Also check environment variable for admin status
              const isAdminByEmail = ADMIN_EMAILS.includes(firebaseUser.email || "")
              userData.isAdmin = userData.isAdmin || isAdminByEmail

              setUser(userData)
              setIsAdmin(userData.isAdmin)
            } catch (error) {
              console.error("Error loading user data:", error)
              // Fallback to basic user data
              const basicUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                firstName: "",
                lastName: "",
                isAdmin: ADMIN_EMAILS.includes(firebaseUser.email || ""),
              }
              setUser(basicUser)
              setIsAdmin(basicUser.isAdmin)
            }
          } else {
            setUser(null)
            setIsAdmin(false)
          }

          setLoading(false)
          setAuthInitialized(true)
        })

        return unsubscribe
      } catch (error) {
        console.error("Error initializing auth:", error)
        setLoading(false)
        setAuthInitialized(true)
      }
    }

    initAuth()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { auth } = await import("@/lib/firebase")
      const { signInWithEmailAndPassword } = await import("firebase/auth")

      if (!auth) {
        throw new Error("Firebase Auth not initialized")
      }

      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error("Sign in error:", error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      const { auth, db } = await import("@/lib/firebase")
      const { createUserWithEmailAndPassword } = await import("firebase/auth")
      const { collection, addDoc, Timestamp } = await import("firebase/firestore")

      if (!auth || !db) {
        throw new Error("Firebase not initialized")
      }

      const { user } = await createUserWithEmailAndPassword(auth, email, password)

      // Create user document in Firestore with name fields
      await addDoc(collection(db, "users"), {
        uid: user.uid,
        email,
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        ...userData,
        createdAt: Timestamp.now(),
      })
    } catch (error) {
      console.error("Sign up error:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      const { auth } = await import("@/lib/firebase")
      const { signOut } = await import("firebase/auth")

      if (!auth) {
        throw new Error("Firebase Auth not initialized")
      }

      await signOut(auth)
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    }
  }

  const contextValue: AuthContextType = {
    user,
    isAdmin,
    loading,
    signIn,
    signUp,
    logout,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
