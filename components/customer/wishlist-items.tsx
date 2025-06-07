"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Trash2, Heart } from "lucide-react"
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
            console.log("Fetching wishlist for user:", userId)
            fetchWishlistItems()
        }
    }, [userId])

    async function fetchWishlistItems() {
        setLoading(true)
        try {
            const { db } = await import("@/lib/firebase")
            const { collection, query, where, getDocs, getDoc, doc } = await import("firebase/firestore")

            console.log("Querying wishlist collection...")
            // Fetch wishlist items from Firestore
            const wishlistRef = collection(db, "wishlist")
            const q = query(wishlistRef, where("userId", "==", userId))
            const querySnapshot = await getDocs(q)

            console.log(`Found ${querySnapshot.size} wishlist items`)

            // Get product details for each wishlist item
            const items = []
            for (const wishlistDoc of querySnapshot.docs) {
                const wishlistData = wishlistDoc.data()
                console.log("Processing wishlist item:", wishlistData.productId)

                const productRef = doc(db, "products", wishlistData.productId)
                const productDoc = await getDoc(productRef)

                if (productDoc.exists()) {
                    const productData = productDoc.data()
                    items.push({
                        id: wishlistDoc.id,
                        productId: wishlistData.productId,
                        product: {
                            id: wishlistData.productId,
                            name: productData.name,
                            price: productData.price,
                            images: productData.images || [],
                            featuredImage: productData.images?.[0],
                            inStock: productData.inStock !== false,
                            stockQuantity: productData.stockQuantity || 10,
                        },
                        name: productData.name,
                        price: productData.price,
                        imageUrl: productData.images?.[0] || "/placeholder.svg?height=80&width=80",
                        addedAt: wishlistData.addedAt,
                    })
                } else {
                    console.log(`Product ${wishlistData.productId} not found`)
                }
            }

            console.log("Processed wishlist items:", items.length)
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
            <div className="p-6">
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
                                <Skeleton className="w-1/2 h-4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (wishlistItems.length === 0) {
        return (
            <div className="p-12 text-center">
                <div className="mx-auto bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                    <Heart className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium mb-2">Your wishlist is empty</h3>
                <p className="text-sm text-gray-500 mb-6">Items added to your wishlist will appear here</p>
                <Button asChild>
                    <Link href="/products">Browse Products</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
                {wishlistItems.map((item) => (
                    <div key={item.id} className="p-4 bg-white rounded-lg shadow border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Image
                                    src={item.imageUrl || "/placeholder.svg"}
                                    alt={item.name}
                                    width={80}
                                    height={80}
                                    className="rounded-lg object-cover"
                                />
                                <div>
                                    <Link href={`/products/${item.productId}`} className="hover:underline">
                                        <h3 className="font-medium">{item.name}</h3>
                                    </Link>
                                    <p className="text-sm text-muted-foreground mt-1">${item.price}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm" onClick={() => removeFromWishlist(item.id)}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remove
                                </Button>
                                <AddToCartButton product={item.product} variant="icon" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
