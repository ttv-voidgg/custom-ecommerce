"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { AddToCartButton } from "@/components/add-to-cart-button"

interface WishlistItemsProps {
    userId: string
}

export function WishlistItems({ userId }: WishlistItemsProps) {
    const [wishlistItems, setWishlistItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        if (userId) {
            fetchWishlistItems()
        }
    }, [userId])

    async function fetchWishlistItems() {
        setLoading(true)
        try {
            const { db } = await import("@/lib/firebase")
            const { collection, query, where, getDocs, getDoc, doc } = await import("firebase/firestore")

            // Fetch wishlist items from Firestore
            const wishlistRef = collection(db, "wishlist")
            const q = query(wishlistRef, where("userId", "==", userId))
            const querySnapshot = await getDocs(q)

            // Get product details for each wishlist item
            const items = []
            for (const wishlistDoc of querySnapshot.docs) {
                const wishlistData = wishlistDoc.data()
                const productRef = doc(db, "products", wishlistData.productId)
                const productDoc = await getDoc(productRef)

                if (productDoc.exists()) {
                    const productData = productDoc.data()
                    items.push({
                        id: wishlistDoc.id,
                        productId: wishlistData.productId,
                        name: productData.name,
                        price: productData.price,
                        imageUrl: productData.images?.[0] || "/placeholder.svg?height=80&width=80",
                        addedAt: wishlistData.addedAt,
                    })
                }
            }

            setWishlistItems(items)
        } catch (error) {
            console.error("Error fetching wishlist items:", error)
            toast({
                title: "Error",
                description: "Failed to load wishlist items.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    async function removeFromWishlist(wishlistItemId: string) {
        try {
            const { db } = await import("@/lib/firebase")
            const { doc, deleteDoc } = await import("firebase/firestore")

            await deleteDoc(doc(db, "wishlist", wishlistItemId))

            // Update local state
            setWishlistItems((prev) => prev.filter((item) => item.id !== wishlistItemId))

            toast({
                title: "Success",
                description: "Item removed from wishlist.",
            })
        } catch (error) {
            console.error("Error removing from wishlist:", error)
            toast({
                title: "Error",
                description: "Failed to remove item from wishlist.",
                variant: "destructive",
            })
        }
    }

    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map((_, index) => (
                    <div key={index} className="p-4 bg-white rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <Skeleton className="w-20 h-20 rounded-lg" />
                            <div className="flex items-center space-x-4">
                                <Skeleton className="w-8 h-8 rounded-full" />
                                <Skeleton className="w-8 h-8 rounded-full" />
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            <Skeleton className="w-full h-4" />
                            <Skeleton className="w-full h-4" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            {wishlistItems.map((item) => (
                <div key={item.id} className="p-4 bg-white rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <Image
                            src={item.imageUrl || "/placeholder.svg"}
                            alt={item.name}
                            width={80}
                            height={80}
                            className="rounded-lg"
                        />
                        <div className="flex items-center space-x-4">
                            <Button variant="outline" onClick={() => removeFromWishlist(item.id)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                            <AddToCartButton productId={item.productId} />
                        </div>
                    </div>
                    <div className="mt-4 space-y-2">
                        <Link href={`/products/${item.productId}`}>
                            <h3 className="text-lg font-semibold">{item.name}</h3>
                        </Link>
                        <p className="text-sm text-muted-foreground">${item.price}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}
