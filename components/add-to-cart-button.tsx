"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ShoppingBag, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/cart-contexts"
import { useToast } from "@/components/ui/use-toast"

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
    const { addToCart } = useCart()
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
            const productData = await response.json()
            setProduct(productData)
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

    const handleAddToCart = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }

        if (!product || disabled || loading) return

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
                disabled={disabled || !product}
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
                                disabled={quantity >= (product?.stockQuantity || 99)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                <Button
                    className={`flex-1 bg-gray-900 hover:bg-gray-800 text-white ${className}`}
                    onClick={handleAddToCart}
                    disabled={disabled || !product}
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
            <div className="space-y-4">
                <Button
                    className={`flex-1 bg-gray-900 hover:bg-gray-800 text-white ${className}`}
                    onClick={handleAddToCart}
                    disabled={disabled || !product?.inStock}
                    size={size}
                >
                    Add to Cart
                </Button>
            </div>
        )
    }

    // Default variant - button with text and icon
    return (
        <Button
            className={`bg-gray-900 hover:bg-gray-800 text-white ${className}`}
            onClick={handleAddToCart}
            disabled={disabled || !product}
            size={size}
        >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Add to Cart
        </Button>
    )
}
