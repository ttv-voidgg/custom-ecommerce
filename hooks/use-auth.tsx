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

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

// Admin emails from environment variable
const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",") || ["juancarlos.deborja@gmail.com"]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

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
          return
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          setUser(user)

          if (user) {
            // Check if user is admin from Firestore
            try {
              const userRef = collection(db, "users")
              const q = query(userRef, where("uid", "==", user.uid))
              const querySnapshot = await getDocs(q)

              let adminStatus = false
              if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data()
                adminStatus = userData.isAdmin === true
              }

              // Also check environment variable
              const isAdminByEmail = ADMIN_EMAILS.includes(user.email || "")
              setIsAdmin(adminStatus || isAdminByEmail)
            } catch (error) {
              console.error("Error checking admin status:", error)
              // Fallback to email check
              setIsAdmin(ADMIN_EMAILS.includes(user.email || ""))
            }
          } else {
            setIsAdmin(false)
          }

          setLoading(false)
        })

        return unsubscribe
      } catch (error) {
        console.error("Error initializing auth:", error)
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { auth } = await import("@/lib/firebase")
      const { signInWithEmailAndPassword } = await import("firebase/auth")
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

      const { user } = await createUserWithEmailAndPassword(auth, email, password)

      // Create user document in Firestore
      await addDoc(collection(db, "users"), {
        uid: user.uid,
        email,
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
      await signOut(auth)
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        signIn,
        signUp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
