import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const results: any = {
        timestamp: new Date().toISOString(),
        tests: {},
    }

    try {
        // Test Firebase import
        console.log("Testing Firebase import...")
        const { db } = await import("@/lib/firebase")
        results.tests.firebaseImport = {
            status: "✅ Success",
            dbExists: !!db,
        }

        if (!db) {
            results.tests.firebaseImport.status = "❌ Database not initialized"
            return NextResponse.json(results)
        }

        // Test Firestore operations
        console.log("Testing Firestore operations...")
        const { collection, getDocs, query, orderBy } = await import("firebase/firestore")

        try {
            const productsRef = collection(db, "products")
            const snapshot = await getDocs(productsRef)

            results.tests.firestoreQuery = {
                status: "✅ Success",
                collectionExists: true,
                documentCount: snapshot.size,
                documents: snapshot.docs.map((doc) => ({
                    id: doc.id,
                    data: doc.data(),
                })),
            }
        } catch (firestoreError: any) {
            results.tests.firestoreQuery = {
                status: "❌ Failed",
                error: firestoreError.message,
                code: firestoreError.code,
            }
        }

        // Test environment
        results.tests.environment = {
            nodeEnv: process.env.NODE_ENV,
            hasFirebaseApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            hasFirebaseAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            hasFirebaseProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        }
    } catch (error: any) {
        results.error = {
            message: error.message,
            stack: error.stack,
        }
    }

    return NextResponse.json(results)
}
