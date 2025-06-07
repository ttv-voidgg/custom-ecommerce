"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"

export default function DebugPage() {
    const { user, isAdmin } = useAuth()
    const [debugInfo, setDebugInfo] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const runDebug = async () => {
        setLoading(true)
        const results: any = {
            timestamp: new Date().toISOString(),
            tests: {},
        }

        try {
            // Test 1: Check Firebase connection
            console.log("Testing Firebase connection...")
            try {
                const { db } = await import("@/lib/firebase")
                const { collection, getDocs } = await import("firebase/firestore")

                results.tests.firebaseConnection = {
                    status: db ? "✅ Connected" : "❌ Not connected",
                    db: !!db,
                }

                // Test 2: Direct Firestore query
                if (db) {
                    try {
                        const productsRef = collection(db, "products")
                        const snapshot = await getDocs(productsRef)
                        results.tests.directFirestoreQuery = {
                            status: "✅ Success",
                            count: snapshot.size,
                            docs: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
                        }
                    } catch (error: any) {
                        results.tests.directFirestoreQuery = {
                            status: "❌ Failed",
                            error: error.message,
                        }
                    }
                }
            } catch (error: any) {
                results.tests.firebaseConnection = {
                    status: "❌ Failed to import",
                    error: error.message,
                }
            }

            // Test 3: API endpoint test
            console.log("Testing API endpoint...")
            try {
                const response = await fetch("/api/products")
                const data = await response.json()
                results.tests.apiEndpoint = {
                    status: response.ok ? "✅ Success" : "❌ Failed",
                    statusCode: response.status,
                    data: data,
                }
            } catch (error: any) {
                results.tests.apiEndpoint = {
                    status: "❌ Failed",
                    error: error.message,
                }
            }

            // Test 4: Environment variables
            results.tests.environment = {
                hasFirebaseConfig: !!(
                    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
                    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
                    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
                ),
                nodeEnv: process.env.NODE_ENV,
            }

            // Test 5: User authentication
            results.tests.authentication = {
                userLoggedIn: !!user,
                isAdmin: !!isAdmin,
                userEmail: user?.email || "Not logged in",
            }
        } catch (error: any) {
            results.error = error.message
        }

        setDebugInfo(results)
        setLoading(false)
    }

    const seedProducts = async () => {
        try {
            const response = await fetch("/api/seed-products", { method: "POST" })
            const result = await response.json()
            console.log("Seed result:", result)
            // Re-run debug after seeding
            setTimeout(runDebug, 1000)
        } catch (error) {
            console.error("Seed error:", error)
        }
    }

    useEffect(() => {
        if (user && isAdmin) {
            runDebug()
        }
    }, [user, isAdmin])

    if (!user || !isAdmin) {
        return <div>Please log in as admin</div>
    }

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Debug Dashboard</h1>
                <p className="text-gray-600">Diagnose issues with the product system</p>
            </div>

            <div className="space-y-4 mb-6">
                <Button onClick={runDebug} disabled={loading}>
                    {loading ? "Running Tests..." : "Run Debug Tests"}
                </Button>
                <Button onClick={seedProducts} variant="outline">
                    Seed Products
                </Button>
            </div>

            {debugInfo && (
                <Card>
                    <CardHeader>
                        <CardTitle>Debug Results</CardTitle>
                        <CardDescription>Test results from {debugInfo.timestamp}</CardDescription>
                    </CardHeader>
                    <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
