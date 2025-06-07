"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ShoppingBag, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/cart-contexts"
import { useToast } from "@/hooks/use-toast"

interface AddToCartButtonProps {
    product?: any
    productId?: string
    variant?: "default" | "icon" | "full" | "textOnly"
    size?: "sm" | "default" | "lg"
    className?: string
    showQuantitySelector?: boolean
    disabled?: boolean
}

export function AddToCartButton({
                                    product: initialProduct,
                                    productId,
                                    variant = "default",
                                    size = "default",
                                    className = "",
                                    showQuantitySelector = false,
                                    disabled = false,
                                }: AddToCartButtonProps) {
    const { items, addToCart } = useCart()
    const [quantity, setQuantity] = useState(1)
    const [product, setProduct] = useState(initialProduct)
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    // Fetch product if only productId is provided
    useEffect(() => {
        if (productId && !product) {
            fetchProduct()
        }
    }, [productId, product])

    const fetchProduct = async () => {
        if (!productId) return

        setLoading(true)
        try {
            const response = await fetch(`/api/products/${productId}`)
            if (!response.ok) {
                throw new Error("Failed to fetch product")
            }
            const data = await response.json()
            if (data.success) {
                setProduct(data.product)
            } else {
                throw new Error(data.message || "Failed to fetch product")
            }
        } catch (error) {
            console.error("Error fetching product:", error)
            toast({
                title: "Error",
                description: "Failed to load product information",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    // Check if we can add this quantity to cart (respecting stock limits)
    const canAddToCart = (qty: number) => {
        if (!product) return false

        // Get current quantity in cart
        const currentInCart = items.find((item) => item.id === (product.id || productId))?.quantity || 0

        // Check if adding this quantity would exceed stock
        const stockLimit = product.stockQuantity || 0
        return currentInCart + qty <= stockLimit
    }

    const handleAddToCart = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }

        if (!product || disabled || loading) return

        // Check stock limits
        if (!canAddToCart(quantity)) {
            const currentInCart = items.find((item) => item.id === (product.id || productId))?.quantity || 0
            const remaining = (product.stockQuantity || 0) - currentInCart

            if (remaining <= 0) {
                toast({
                    title: "Stock Limit Reached",
                    description: "This item is already in your cart at maximum quantity",
                    variant: "destructive",
                })
            } else {
                toast({
                    title: "Stock Limit Reached",
                    description: `You can only add ${remaining} more of this item`,
                    variant: "destructive",
                })

                // Add the remaining quantity instead
                if (remaining > 0) {
                    addToCart(product, remaining)
                }
            }
            return
        }

        addToCart(product, quantity)
    }

    const incrementQuantity = () => {
        const maxQuantity = product?.stockQuantity || 99
        setQuantity((prev) => Math.min(prev + 1, maxQuantity))
    }

    const decrementQuantity = () => {
        setQuantity((prev) => Math.max(prev - 1, 1))
    }

    // Show loading state
    if (loading) {
        return (
            <Button
                variant={variant === "icon" ? "secondary" : "default"}
                size={variant === "icon" ? "icon" : size}
                className={
                    variant === "icon"
                        ? `bg-white/90 hover:bg-white shadow-lg ${className}`
                        : `bg-gray-900 hover:bg-gray-800 text-white ${className}`
                }
                disabled
            >
                <ShoppingBag className="h-4 w-4 animate-pulse" />
                {variant !== "icon" && variant !== "textOnly" && <span className="ml-2">Loading...</span>}
            </Button>
        )
    }

    // Icon variant - just the shopping bag icon
    if (variant === "icon") {
        return (
            <Button
                variant="secondary"
                size="icon"
                className={`bg-white/90 hover:bg-white shadow-lg ${className}`}
                onClick={handleAddToCart}
                disabled={disabled || !product || !product.inStock}
            >
                <ShoppingBag className="h-4 w-4 text-gray-600" />
            </Button>
        )
    }

    // Full variant - with quantity selector
    if (variant === "full") {
        return (
            <div className="space-y-4">
                {showQuantitySelector && (
                    <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-900">Quantity:</span>
                        <div className="flex items-center border border-gray-300 rounded-md">
                            <Button variant="ghost" size="sm" onClick={decrementQuantity} disabled={quantity <= 1}>
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="px-4 py-2 text-sm font-medium">{quantity}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={incrementQuantity}
                                disabled={quantity >= (product?.stockQuantity || 0)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                <Button
                    className={`flex-1 bg-gray-900 hover:bg-gray-800 text-white ${className}`}
                    onClick={handleAddToCart}
                    disabled={disabled || !product || !product.inStock}
                    size={size}
                >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Add to Cart
                </Button>
            </div>
        )
    }

    //Text only variant
    if (variant === "textOnly") {
        return (
            <Button
                className={`flex-1 bg-gray-900 hover:bg-gray-800 max-w-fit text-white ${className}`}
                onClick={handleAddToCart}
                disabled={disabled || !product || !product.inStock}
                size={size}
            >
                Add to Cart
            </Button>
        )
    }

    // Default variant - button with text and icon
    return (
        <Button
            className={`bg-gray-900 hover:bg-gray-800 text-white ${className}`}
            onClick={handleAddToCart}
            disabled={disabled || !product || !product.inStock}
            size={size}
        >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Add to Cart
        </Button>
    )
}
