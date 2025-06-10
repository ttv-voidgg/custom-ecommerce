"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"

interface CartItem {
    id: string
    name: string
    price: number
    quantity: number
    image?: string
    category?: string
}

interface CartContextType {
    items: CartItem[]
    totalItems: number
    totalPrice: number
    addToCart: (product: any, quantity?: number) => void
    removeFromCart: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

// Cookie helper functions
const setCookie = (name: string, value: string, days = 30) => {
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null

    const nameEQ = name + "="
    const ca = document.cookie.split(";")
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i]
        while (c.charAt(0) === " ") c = c.substring(1, c.length)
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
    }
    return null
}

const deleteCookie = (name: string) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
}

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])
    const [isLoaded, setIsLoaded] = useState(false)
    const { toast } = useToast()

    // Load cart from cookies on mount
    useEffect(() => {
        try {
            const savedCart = getCookie("cart")
            if (savedCart) {
                const parsedCart = JSON.parse(decodeURIComponent(savedCart))
                if (Array.isArray(parsedCart)) {
                    setItems(parsedCart)
                }
            }
        } catch (error) {
            console.error("Error loading cart from cookies:", error)
            // Clear corrupted cookie
            deleteCookie("cart")
        } finally {
            setIsLoaded(true)
        }
    }, [])

    // Save cart to cookies whenever items change (but only after initial load)
    useEffect(() => {
        if (isLoaded) {
            try {
                if (items.length > 0) {
                    const cartData = encodeURIComponent(JSON.stringify(items))
                    setCookie("cart", cartData, 30) // 30 days expiry
                } else {
                    deleteCookie("cart")
                }

                // Also save to localStorage as backup
                localStorage.setItem("cart", JSON.stringify(items))
            } catch (error) {
                console.error("Error saving cart to cookies:", error)
                // Fallback to localStorage only
                try {
                    localStorage.setItem("cart", JSON.stringify(items))
                } catch (localError) {
                    console.error("Error saving cart to localStorage:", localError)
                }
            }
        }
    }, [items, isLoaded])

    const addToCart = async (product: any, quantity = 1) => {
        // Validate stock before adding
        try {
            // Fetch latest stock information
            const response = await fetch(`/api/products/${product.id}`)
            const data = await response.json()

            if (data.success) {
                const currentStock = data.product.stockQuantity || 0
                const currentInCart = items.find((item) => item.id === product.id)?.quantity || 0

                // Check if adding would exceed stock
                if (currentInCart + quantity > currentStock) {
                    const available = currentStock - currentInCart

                    if (available <= 0) {
                        toast({
                            title: "Stock Limit Reached",
                            description: "This item is already in your cart at maximum quantity",
                            variant: "destructive",
                        })
                        return
                    }

                    // Add only what's available
                    quantity = available
                    toast({
                        title: "Limited Stock",
                        description: `Only ${available} more available. Added to your cart.`,
                    })
                }
            }
        } catch (error) {
            console.error("Error checking stock:", error)
            // Continue with add to cart, but might exceed stock
        }

        setItems((prevItems) => {
            const existingItem = prevItems.find((item) => item.id === product.id)

            if (existingItem) {
                // Update quantity if item already exists
                return prevItems.map((item) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
                )
            } else {
                // Add new item
                return [
                    ...prevItems,
                    {
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        quantity,
                        image: product.featuredImage || product.images?.[0],
                        category: product.category,
                    },
                ]
            }
        })

        toast({
            title: "Added to Cart",
            description: `${quantity} ${product.name} added to your cart`,
        })
    }

    const removeFromCart = (productId: string) => {
        setItems((prevItems) => prevItems.filter((item) => item.id !== productId))

        toast({
            title: "Removed from Cart",
            description: "Item removed from your cart",
        })
    }

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId)
            return
        }

        setItems((prevItems) => prevItems.map((item) => (item.id === productId ? { ...item, quantity } : item)))
    }

    const clearCart = () => {
        setItems([])
        toast({
            title: "Cart Cleared",
            description: "All items removed from your cart",
        })
    }

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    return (
        <CartContext.Provider
            value={{
                items,
                totalItems,
                totalPrice,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider")
    }
    return context
}
