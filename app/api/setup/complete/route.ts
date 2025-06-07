import { NextResponse } from "next/server"
import { doc, setDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function POST() {
  try {
    console.log("Completing setup...")

    // Mark setup as complete
    await setDoc(doc(db, "settings", "setup"), {
      completed: true,
      completedAt: Timestamp.now(),
      version: "1.0.0",
    })

    console.log("Setup marked as complete")

    return NextResponse.json({
      success: true,
      message: "Setup completed successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Error completing setup:", error)
    return NextResponse.json(
        {
          error: error.message || "Failed to complete setup",
          code: error.code || "unknown",
        },
        { status: 500 },
    )
  }
}
