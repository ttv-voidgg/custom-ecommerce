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

const CartContexts = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])
    const { toast } = useToast()

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem("cart")
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart))
            } catch (error) {
                console.error("Error loading cart from localStorage:", error)
            }
        }
    }, [])

    // Save cart to localStorage whenever items change
    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(items))
    }, [items])

    const addToCart = (product: any, quantity = 1) => {
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
        <CartContexts.Provider
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
        </CartContexts.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContexts)
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider")
    }
    return context
}
