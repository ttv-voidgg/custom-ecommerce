import { cookies } from "next/headers"
import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"

// Initialize Firebase Admin if it hasn't been initialized
function initializeFirebaseAdmin() {
    if (getApps().length === 0) {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

        if (!projectId) {
            throw new Error("Firebase project ID is not defined")
        }

        initializeApp({
            credential: cert({
                projectId,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            }),
        })
    }

    return {
        auth: getAuth(),
        db: getFirestore(),
    }
}

export async function getServerSession() {
    try {
        const cookieStore = cookies()
        const token = cookieStore.get("firebaseToken")?.value

        if (!token) {
            return null
        }

        const { auth, db } = initializeFirebaseAdmin()

        // Verify the token
        const decodedToken = await auth.verifyIdToken(token)

        if (!decodedToken) {
            return null
        }

        // Get user data from Firestore
        const userDoc = await db.collection("users").where("uid", "==", decodedToken.uid).get()

        if (userDoc.empty) {
            return {
                uid: decodedToken.uid,
                email: decodedToken.email,
            }
        }

        const userData = userDoc.docs[0].data()

        return {
            uid: decodedToken.uid,
            email: decodedToken.email,
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            isAdmin: userData.isAdmin === true,
        }
    } catch (error) {
        console.error("Error getting server session:", error)
        return null
    }
}
