"use client"

import { useState } from "react"
import { ShoppingBag, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/cart-contexts"

interface AddToCartButtonProps {
    product: any
    variant?: "default" | "icon" | "full" | "textOnly"
    size?: "sm" | "default" | "lg"
    className?: string
    showQuantitySelector?: boolean
    disabled?: boolean
}

export function AddToCartButton({
                                    product,
                                    variant = "default",
                                    size = "default",
                                    className = "",
                                    showQuantitySelector = false,
                                    disabled = false,
                                }: AddToCartButtonProps) {
    const { addToCart } = useCart()
    const [quantity, setQuantity] = useState(1)

    const handleAddToCart = () => {
        if (!product || disabled) return
        addToCart(product, quantity)
    }

    const incrementQuantity = () => {
        const maxQuantity = product?.stockQuantity || 99
        setQuantity((prev) => Math.min(prev + 1, maxQuantity))
    }

    const decrementQuantity = () => {
        setQuantity((prev) => Math.max(prev - 1, 1))
    }

    // Icon variant - just the shopping bag icon
    if (variant === "icon") {
        return (
            <Button
                variant="secondary"
                size="icon"
                className={`bg-white/90 hover:bg-white shadow-lg ${className}`}
                onClick={handleAddToCart}
                disabled={disabled || !product?.inStock}
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
                    disabled={disabled || !product?.inStock}
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
            disabled={disabled || !product?.inStock}
            size={size}
        >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Add to Cart
        </Button>
    )
}
