"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { WishlistItems } from "@/components/customer/wishlist-items"

export default function WishlistPage() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { auth } = await import("@/lib/firebase")
                const { onAuthStateChanged } = await import("firebase/auth")

                const unsubscribe = onAuthStateChanged(auth, (user) => {
                    console.log("Auth state changed:", user ? "User logged in" : "No user")
                    setUser(user)
                    setLoading(false)
                })

                return () => unsubscribe()
            } catch (error) {
                console.error("Error checking auth:", error)
                setLoading(false)
            }
        }

        checkAuth()
    }, [])

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-semibold mb-4">Please sign in to view your wishlist</h2>
                <Button asChild>
                    <a href="/auth">Sign In</a>
                </Button>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight">My Wishlist</h1>
                <p className="text-sm text-gray-500 mt-1">Items you've saved for later</p>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <WishlistItems userId={user.uid} />
            </div>
        </div>
    )
}
