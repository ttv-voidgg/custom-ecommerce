"use client"

import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface AddToWishlistButtonProps {
    productId: string
    className?: string
}

export function AddToWishlistButton({ productId, className }: AddToWishlistButtonProps) {
    const [user, setUser] = useState<any>(null)
    const [isInWishlist, setIsInWishlist] = useState(false)
    const [loading, setLoading] = useState(false)
    const [checking, setChecking] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { auth } = await import("@/lib/firebase")
                const { onAuthStateChanged } = await import("firebase/auth")

                const unsubscribe = onAuthStateChanged(auth, (user) => {
                    setUser(user)
                    if (user) {
                        checkWishlistStatus(user.uid)
                    } else {
                        setChecking(false)
                    }
                })

                return () => unsubscribe()
            } catch (error) {
                console.error("Error checking auth:", error)
                setChecking(false)
            }
        }

        checkAuth()
    }, [productId])

    async function checkWishlistStatus(userId: string) {
        setChecking(true)
        try {
            const { db } = await import("@/lib/firebase")
            const { collection, query, where, getDocs } = await import("firebase/firestore")

            const wishlistRef = collection(db, "wishlist")
            const q = query(wishlistRef, where("userId", "==", userId), where("productId", "==", productId))
            const querySnapshot = await getDocs(q)

            setIsInWishlist(!querySnapshot.empty)
        } catch (error) {
            console.error("Error checking wishlist status:", error)
        } finally {
            setChecking(false)
        }
    }

    async function toggleWishlist() {
        if (!user) {
            toast({
                title: "Sign in required",
                description: "Please sign in to add items to your wishlist",
            })
            return
        }

        setLoading(true)
        try {
            const { db } = await import("@/lib/firebase")
            const { collection, query, where, getDocs, addDoc, deleteDoc, serverTimestamp } = await import(
                "firebase/firestore"
                )

            // Check if item is already in wishlist
            const wishlistRef = collection(db, "wishlist")
            const q = query(wishlistRef, where("userId", "==", user.uid), where("productId", "==", productId))
            const querySnapshot = await getDocs(q)

            if (querySnapshot.empty) {
                // Add to wishlist
                await addDoc(wishlistRef, {
                    userId: user.uid,
                    productId,
                    addedAt: serverTimestamp(),
                })
                setIsInWishlist(true)
                toast({
                    title: "Added to wishlist",
                    description: "Item has been added to your wishlist",
                })
            } else {
                // Remove from wishlist
                const docToDelete = querySnapshot.docs[0]
                await deleteDoc(docToDelete.ref)
                setIsInWishlist(false)
                toast({
                    title: "Removed from wishlist",
                    description: "Item has been removed from your wishlist",
                })
            }
        } catch (error) {
            console.error("Error updating wishlist:", error)
            toast({
                title: "Error",
                description: "Failed to update wishlist",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="outline"
            size="icon"
            className={className}
            disabled={checking || loading || !user}
            onClick={toggleWishlist}
        >
            <Heart className={`h-4 w-4 ${isInWishlist ? "fill-red-500 text-red-500" : ""}`} />
        </Button>
    )
}
