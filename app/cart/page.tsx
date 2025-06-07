"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Trash2, ChevronLeft, ChevronRight, ShoppingBag, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/contexts/cart-contexts"
import { StoreHeader } from "@/components/store-header"
import { useToast } from "@/hooks/use-toast"

export default function CartPage() {
    const { items, totalItems, totalPrice, updateQuantity, removeFromCart, clearCart } = useCart()
    const { toast } = useToast()
    const [stockLevels, setStockLevels] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(true)

    // Tax rate and shipping cost
    const taxRate = 0.07 // 7% tax
    const shippingCost = totalPrice > 100 ? 0 : 10 // Free shipping over $100

    // Calculate totals
    const subtotal = totalPrice
    const tax = subtotal * taxRate
    const total = subtotal + tax + shippingCost

    // Fetch stock levels for all products in cart
    useEffect(() => {
        if (items.length === 0) {
            setLoading(false)
            return
        }

        const fetchStockLevels = async () => {
            setLoading(true)
            try {
                const productIds = items.map((item) => item.id)
                const stockData: Record<string, number> = {}

                // Fetch each product to get current stock level
                await Promise.all(
                    productIds.map(async (id) => {
                        try {
                            const response = await fetch(`/api/products/${id}`)
                            const data = await response.json()

                            if (data.success && data.product) {
                                stockData[id] = data.product.stockQuantity || 0
                            }
                        } catch (error) {
                            console.error(`Error fetching stock for product ${id}:`, error)
                        }
                    }),
                )

                setStockLevels(stockData)
            } catch (error) {
                console.error("Error fetching stock levels:", error)
                toast({
                    title: "Error",
                    description: "Could not fetch current stock levels",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }

        fetchStockLevels()
    }, [items, toast])

    // Handle quantity changes
    const handleQuantityChange = (productId: string, newQuantity: number) => {
        const stockLimit = stockLevels[productId] || 0

        if (newQuantity > stockLimit) {
            toast({
                title: "Stock Limit Reached",
                description: `Only ${stockLimit} items available in stock`,
                variant: "destructive",
            })
            // Set to maximum available
            updateQuantity(productId, stockLimit)
            return
        }

        updateQuantity(productId, newQuantity)
    }

    // Handle remove item
    const handleRemoveItem = (productId: string, productName: string) => {
        removeFromCart(productId)
        toast({
            title: "Item Removed",
            description: `${productName} has been removed from your cart`,
        })
    }

    // Handle clear cart
    const handleClearCart = () => {
        clearCart()
    }

    // Empty cart state
    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-white pt-16">
                <StoreHeader />
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <h1 className="text-3xl font-light text-gray-900 mb-8">Shopping Cart</h1>
                    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center">
                        <div className="flex justify-center mb-6">
                            <ShoppingBag className="h-16 w-16 text-gray-300" />
                        </div>
                        <h2 className="text-2xl font-medium text-gray-900 mb-2">Your cart is empty</h2>
                        <p className="text-gray-500 mb-6">Looks like you haven't added any items to your cart yet.</p>
                        <Link href="/products">
                            <Button className="bg-gray-900 hover:bg-gray-800 text-white">Continue Shopping</Button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white pt-16">
            <StoreHeader />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-3xl font-light text-gray-900 mb-8">Shopping Cart</h1>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Cart Items */}
                    <div className="lg:w-2/3">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-medium text-gray-900">Items ({totalItems})</h2>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClearCart}
                                        className="text-gray-500 hover:text-red-600"
                                    >
                                        Clear Cart
                                    </Button>
                                </div>

                                {loading ? (
                                    <div className="space-y-4">
                                        {[...Array(items.length)].map((_, i) => (
                                            <div key={i} className="flex gap-4 animate-pulse">
                                                <div className="bg-gray-200 h-24 w-24 rounded"></div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="bg-gray-200 h-4 w-1/2 rounded"></div>
                                                    <div className="bg-gray-200 h-4 w-1/4 rounded"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {items.map((item) => (
                                            <div key={item.id} className="flex flex-col sm:flex-row gap-4 py-4 border-b border-gray-100">
                                                {/* Product Image */}
                                                <div className="w-full sm:w-24 h-24 bg-gray-100 rounded-md overflow-hidden">
                                                    <Link href={`/products/${item.id}`}>
                                                        <Image
                                                            src={
                                                                item.image ||
                                                                `/placeholder.svg?height=96&width=96&query=jewelry ${item.category || "elegant"}`
                                                            }
                                                            alt={item.name}
                                                            width={96}
                                                            height={96}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </Link>
                                                </div>

                                                {/* Product Info */}
                                                <div className="flex-1">
                                                    <div className="flex flex-col sm:flex-row justify-between">
                                                        <div>
                                                            <Link href={`/products/${item.id}`}>
                                                                <h3 className="text-lg font-medium text-gray-900 hover:text-gray-600">{item.name}</h3>
                                                            </Link>
                                                            {item.category && <p className="text-sm text-gray-500 capitalize">{item.category}</p>}
                                                        </div>
                                                        <div className="text-right mt-2 sm:mt-0">
                                                            <p className="text-lg font-medium text-gray-900">${item.price.toLocaleString()}</p>
                                                            <p className="text-sm text-gray-500">
                                                                Subtotal: ${(item.price * item.quantity).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Stock Warning */}
                                                    {stockLevels[item.id] !== undefined && stockLevels[item.id] < 5 && (
                                                        <div className="flex items-center text-amber-600 text-sm mt-2">
                                                            <AlertCircle className="h-4 w-4 mr-1" />
                                                            Only {stockLevels[item.id]} left in stock
                                                        </div>
                                                    )}

                                                    {/* Actions */}
                                                    <div className="flex justify-between items-center mt-4">
                                                        <div className="flex items-center border border-gray-300 rounded-md">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                                disabled={item.quantity <= 1}
                                                            >
                                                                <ChevronLeft className="h-4 w-4" />
                                                            </Button>
                                                            <span className="w-8 text-center">{item.quantity}</span>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                                disabled={item.quantity >= (stockLevels[item.id] || 0)}
                                                            >
                                                                <ChevronRight className="h-4 w-4" />
                                                            </Button>
                                                        </div>

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleRemoveItem(item.id, item.name)}
                                                            className="text-gray-500 hover:text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-1" />
                                                            Remove
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="bg-gray-50 p-6">
                                <div className="w-full flex justify-between">
                                    <Link href="/products">
                                        <Button variant="outline" className="flex items-center">
                                            <ChevronLeft className="h-4 w-4 mr-2" />
                                            Continue Shopping
                                        </Button>
                                    </Link>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:w-1/3">
                        <Card>
                            <CardContent className="p-6">
                                <h2 className="text-xl font-medium text-gray-900 mb-6">Order Summary</h2>

                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-medium">${subtotal.toLocaleString()}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tax (7%)</span>
                                        <span>${tax.toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Shipping</span>
                                        <span>{shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}</span>
                                    </div>

                                    <Separator />

                                    <div className="flex justify-between text-lg font-medium">
                                        <span>Total</span>
                                        <span>${total.toFixed(2)}</span>
                                    </div>

                                    {subtotal < 100 && (
                                        <div className="text-sm text-gray-600 mt-2">
                                            Add ${(100 - subtotal).toFixed(2)} more to qualify for free shipping
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="bg-gray-50 p-6">
                                <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white">Proceed to Checkout</Button>
                            </CardFooter>
                        </Card>

                        {/* Promo Code (Optional) */}
                        <Card className="mt-4">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Have a promo code?</h3>
                                <div className="flex">
                                    <input
                                        type="text"
                                        placeholder="Enter code"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                                    />
                                    <Button className="rounded-l-none bg-gray-900 hover:bg-gray-800 text-white">Apply</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
