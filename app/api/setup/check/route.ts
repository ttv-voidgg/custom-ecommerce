import { NextResponse } from "next/server"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function GET() {
  try {
    console.log("Checking setup status...")

    const setupDoc = await getDoc(doc(db, "settings", "setup"))
    const isComplete = setupDoc.exists() && setupDoc.data()?.completed === true

    console.log("Setup complete:", isComplete)

    return NextResponse.json({
      setupComplete: isComplete,
      data: setupDoc.exists() ? setupDoc.data() : null,
    })
  } catch (error: any) {
    console.error("Error checking setup status:", error)
    return NextResponse.json({
      setupComplete: false,
      error: error.message,
      code: error.code || "unknown",
    })
  }
}
