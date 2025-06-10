"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Trash2, ChevronLeft, ChevronRight, ShoppingBag, AlertCircle, MapPin, Plus, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/contexts/cart-contexts"
import { StoreHeader } from "@/components/store-header"
import { useToast } from "@/hooks/use-toast"
import { ShippingCalculator, getShippingSettings, type CalculatedShippingOption } from "@/lib/shipping-calculator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AddressForm } from "@/components/customer/address-form"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Address {
    id: string
    firstName: string
    lastName: string
    address1: string
    address2?: string
    city: string
    state: string
    postalCode: string
    country: string
    phone?: string
    isDefault: boolean
}

export default function CartPage() {
    const { items, totalItems, totalPrice, updateQuantity, removeFromCart, clearCart } = useCart()
    const { toast } = useToast()
    const [user, setUser] = useState<any>(null)
    const [authLoading, setAuthLoading] = useState(true)
    const [stockLevels, setStockLevels] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(true)
    const [shippingOptions, setShippingOptions] = useState<CalculatedShippingOption[]>([])
    const [selectedShipping, setSelectedShipping] = useState<CalculatedShippingOption | null>(null)
    const [addresses, setAddresses] = useState<Address[]>([])
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
    const [loadingAddresses, setLoadingAddresses] = useState(false)
    const [loadingShipping, setLoadingShipping] = useState(false)
    const [isAddAddressOpen, setIsAddAddressOpen] = useState(false)
    const [addressError, setAddressError] = useState<string | null>(null)

    // Tax rate
    const taxRate = 0.07 // 7% tax

    // Calculate totals
    const subtotal = totalPrice
    const tax = subtotal * taxRate
    const shippingCost = selectedShipping?.price || 0
    const total = subtotal + tax + shippingCost

    // Auth state listener - exactly like addresses page
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            console.log("Auth state changed:", firebaseUser?.uid)
            setUser(firebaseUser)
            setAuthLoading(false)
        })

        return () => unsubscribe()
    }, [])

    // Fetch user's addresses - with enhanced error logging
    async function fetchAddresses() {
        if (!user?.uid) {
            setLoadingAddresses(false)
            return
        }

        setLoadingAddresses(true)
        try {
            console.log("Fetching addresses for user:", user.uid)

            const { db } = await import("@/lib/firebase")
            const { collection, query, where, getDocs } = await import("firebase/firestore")

            if (!db) {
                console.error("Database not initialized")
                setLoadingAddresses(false)
                return
            }

            const addressesRef = collection(db, "addresses")
            const q = query(addressesRef, where("userId", "==", user.uid))
            const querySnapshot = await getDocs(q)

            console.log("Found addresses:", querySnapshot.size)

            const addressesData = querySnapshot.docs.map((doc) => {
                const data = doc.data()
                console.log("Address data:", data)
                return {
                    id: doc.id,
                    ...data,
                }
            }) as Address[]

            setAddresses(addressesData)

            // Auto-select default address
            const defaultAddress = addressesData.find((addr) => addr.isDefault)
            if (defaultAddress && !selectedAddress) {
                setSelectedAddress(defaultAddress)
            }
        } catch (error) {
            console.error("Error fetching addresses:", error)
            toast({
                title: "Error",
                description: "Failed to load addresses. Please try again.",
                variant: "destructive",
            })
        } finally {
            setLoadingAddresses(false)
        }
    }

    // Retry function for address loading
    const retryAddressFetch = () => {
        setAddressError(null)
        fetchAddresses()
    }

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

    // Fetch addresses when user is available - exactly like addresses page
    useEffect(() => {
        if (user?.uid) {
            console.log("User available, fetching addresses for:", user.uid)
            fetchAddresses()
        } else {
            console.log("No user available, skipping address fetch")
            setLoadingAddresses(false)
        }
    }, [user?.uid])

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

    const calculateShipping = async () => {
        if (items.length === 0 || !selectedAddress) return

        setLoadingShipping(true)
        try {
            const settings = await getShippingSettings()
            if (!settings) {
                console.error("No shipping settings found")
                return
            }

            const calculator = new ShippingCalculator(settings)
            const options = await calculator.calculateShipping(
                items.map((item) => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    weight: 0.5, // Default weight in kg
                })),
                {
                    country: selectedAddress.country,
                    state: selectedAddress.state,
                    city: selectedAddress.city,
                    postalCode: selectedAddress.postalCode,
                },
                subtotal,
            )

            setShippingOptions(options)

            // Auto-select the cheapest option
            if (options.length > 0 && !selectedShipping) {
                setSelectedShipping(options[0])
            }
        } catch (error) {
            console.error("Error calculating shipping:", error)
            toast({
                title: "Error",
                description: "Could not calculate shipping rates",
                variant: "destructive",
            })
        } finally {
            setLoadingShipping(false)
        }
    }

    useEffect(() => {
        calculateShipping()
    }, [items, selectedAddress, subtotal])

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
                                    {/* Shipping Address Selection */}
                                    <div>
                                        <Label className="text-sm font-medium mb-2 block">Shipping Address</Label>
                                        {authLoading ? (
                                            <div className="text-sm text-gray-500">Loading...</div>
                                        ) : !user ? (
                                            <div className="text-sm text-gray-500 p-3 border border-gray-200 rounded-lg">
                                                <Link href="/auth" className="text-blue-600 hover:text-blue-800">
                                                    Sign in
                                                </Link>{" "}
                                                to use saved addresses or continue as guest
                                            </div>
                                        ) : loadingAddresses ? (
                                            <div className="text-sm text-gray-500">Loading addresses...</div>
                                        ) : addressError ? (
                                            <Alert variant="destructive" className="mb-4">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertTitle>Error loading addresses</AlertTitle>
                                                <AlertDescription className="mt-2">
                                                    {addressError}
                                                    <Button variant="outline" size="sm" onClick={retryAddressFetch} className="mt-2 w-full">
                                                        <RefreshCw className="mr-2 h-4 w-4" />
                                                        Retry
                                                    </Button>
                                                </AlertDescription>
                                            </Alert>
                                        ) : addresses.length === 0 ? (
                                            <div className="space-y-2">
                                                <div className="text-sm text-gray-500 p-3 border border-gray-200 rounded-lg text-center">
                                                    <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                                    <p>No saved addresses</p>
                                                </div>
                                                <Dialog open={isAddAddressOpen} onOpenChange={setIsAddAddressOpen}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" className="w-full">
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Add Address
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-[550px]">
                                                        <DialogHeader>
                                                            <DialogTitle>Add Shipping Address</DialogTitle>
                                                        </DialogHeader>
                                                        <AddressForm
                                                            userId={user.uid}
                                                            onSuccess={() => {
                                                                fetchAddresses()
                                                                setIsAddAddressOpen(false)
                                                            }}
                                                            isDefault={true}
                                                        />
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Select
                                                    value={selectedAddress?.id || ""}
                                                    onValueChange={(value) => {
                                                        const address = addresses.find((addr) => addr.id === value)
                                                        setSelectedAddress(address || null)
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select shipping address" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {addresses.map((address) => (
                                                            <SelectItem key={address.id} value={address.id}>
                                                                <div className="flex items-center">
                                                                    <div>
                                                                        <div className="font-medium">
                                                                            {address.firstName} {address.lastName}
                                                                            {address.isDefault && (
                                                                                <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">Default</span>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-sm text-gray-500">
                                                                            {address.address1}, {address.city}, {address.state} {address.postalCode}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Dialog open={isAddAddressOpen} onOpenChange={setIsAddAddressOpen}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm" className="w-full">
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Add New Address
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-[550px]">
                                                        <DialogHeader>
                                                            <DialogTitle>Add New Address</DialogTitle>
                                                        </DialogHeader>
                                                        <AddressForm
                                                            userId={user.uid}
                                                            onSuccess={() => {
                                                                fetchAddresses()
                                                                setIsAddAddressOpen(false)
                                                            }}
                                                            isDefault={addresses.length === 0}
                                                        />
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected Address Display */}
                                    {selectedAddress && (
                                        <div className="p-3 bg-gray-50 rounded-lg border">
                                            <div className="text-sm">
                                                <div className="font-medium">
                                                    {selectedAddress.firstName} {selectedAddress.lastName}
                                                </div>
                                                <div className="text-gray-600">
                                                    {selectedAddress.address1}
                                                    {selectedAddress.address2 && <>, {selectedAddress.address2}</>}
                                                </div>
                                                <div className="text-gray-600">
                                                    {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}
                                                </div>
                                                <div className="text-gray-600">{selectedAddress.country}</div>
                                                {selectedAddress.phone && <div className="text-gray-600">Phone: {selectedAddress.phone}</div>}
                                            </div>
                                        </div>
                                    )}

                                    {/* Shipping Method Selection */}
                                    {selectedAddress && (
                                        <div>
                                            <Label className="text-sm font-medium mb-2 block">Shipping Method</Label>
                                            {loadingShipping ? (
                                                <div className="text-sm text-gray-500">Calculating shipping rates...</div>
                                            ) : shippingOptions.length > 0 ? (
                                                <div className="space-y-2">
                                                    {shippingOptions.map((option) => (
                                                        <div
                                                            key={option.id}
                                                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                                                selectedShipping?.id === option.id
                                                                    ? "border-gray-900 bg-gray-50"
                                                                    : "border-gray-200 hover:border-gray-300"
                                                            }`}
                                                            onClick={() => setSelectedShipping(option)}
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <div className="font-medium">{option.name}</div>
                                                                    {option.description && (
                                                                        <div className="text-xs text-gray-500">{option.description}</div>
                                                                    )}
                                                                    {option.estimatedDays && (
                                                                        <div className="text-xs text-gray-500">
                                                                            {option.estimatedDays.min === option.estimatedDays.max
                                                                                ? `${option.estimatedDays.min} day${option.estimatedDays.min !== 1 ? "s" : ""}`
                                                                                : `${option.estimatedDays.min}-${option.estimatedDays.max} days`}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="font-medium">
                                                                    {option.price === 0 ? "Free" : `$${option.price.toFixed(2)}`}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-500">No shipping options available</div>
                                            )}
                                        </div>
                                    )}

                                    <Separator />

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
                                </div>
                            </CardContent>
                            <CardFooter className="bg-gray-50 p-6">
                                <Button
                                    className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                                    disabled={!selectedAddress || !selectedShipping}
                                >
                                    Proceed to Checkout
                                </Button>
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
