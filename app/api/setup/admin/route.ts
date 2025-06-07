import { type NextRequest, NextResponse } from "next/server"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { collection, addDoc, Timestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json()

    if (!email || !password || !firstName) {
      return NextResponse.json({ error: "Email, password, and first name are required" }, { status: 400 })
    }

    console.log("Creating admin account for:", email)

    // Create Firebase Auth user
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    console.log("Firebase user created:", user.uid)

    // Create user document in Firestore with admin privileges
    const userDoc = await addDoc(collection(db, "users"), {
      uid: user.uid,
      email,
      firstName,
      lastName,
      isAdmin: true,
      role: "admin",
      createdAt: Timestamp.now(),
      setupComplete: true,
    })

    console.log("User document created:", userDoc.id)

    return NextResponse.json({
      success: true,
      message: "Admin account created successfully",
      userId: user.uid,
      documentId: userDoc.id,
    })
  } catch (error: any) {
    console.error("Error creating admin account:", error)
    return NextResponse.json(
        {
          error: error.message || "Failed to create admin account",
          code: error.code || "unknown",
        },
        { status: 500 },
    )
  }
}
