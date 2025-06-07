"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { AddToCartButton } from "@/components/add-to-cart-button"

interface OrderDetailProps {
    orderId: string
    userId: string
}

export function OrderDetail({ orderId, userId }: OrderDetailProps) {
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchOrderDetails() {
            try {
                const { db } = await import("@/lib/firebase")
                const { doc, getDoc, collection, query, where, getDocs } = await import("firebase/firestore")

                // Get the order document
                const orderDoc = await getDoc(doc(db, "orders", orderId))

                if (!orderDoc.exists()) {
                    setError("Order not found")
                    setLoading(false)
                    return
                }

                const orderData = orderDoc.data()

                // Verify this order belongs to the current user
                if (orderData.userId !== userId) {
                    setError("You don't have permission to view this order")
                    setLoading(false)
                    return
                }

                // Fetch product details for each item in the order
                const orderItems = orderData.items || []
                const productIds = orderItems.map((item: any) => item.productId)

                const products: Record<string, any> = {}

                if (productIds.length > 0) {
                    // Batch fetch products
                    const productsRef = collection(db, "products")
                    const chunks = chunkArray(productIds, 10) // Firestore has a limit of 10 'in' clauses

                    for (const chunk of chunks) {
                        const q = query(productsRef, where("__name__", "in", chunk))
                        const querySnapshot = await getDocs(q)

                        querySnapshot.forEach((doc) => {
                            products[doc.id] = {
                                id: doc.id,
                                ...doc.data(),
                            }
                        })
                    }
                }

                // Enhance order items with product details
                const enhancedItems = orderItems.map((item: any) => {
                    const product = products[item.productId] || {}
                    return {
                        ...item,
                        product,
                    }
                })

                setOrder({
                    id: orderDoc.id,
                    ...orderData,
                    items: enhancedItems,
                })
            } catch (error) {
                console.error("Error fetching order details:", error)
                setError("Failed to load order details")
            } finally {
                setLoading(false)
            }
        }

        fetchOrderDetails()
    }, [orderId, userId])

    // Helper function to chunk array for batched Firestore queries
    function chunkArray(array: any[], size: number) {
        const chunks = []
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size))
        }
        return chunks
    }

    function formatDate(timestamp: any) {
        if (!timestamp) return "N/A"

        try {
            // Handle Firestore Timestamp
            if (timestamp.toDate) {
                return format(timestamp.toDate(), "MMMM d, yyyy 'at' h:mm a")
            }

            // Handle regular date
            return format(new Date(timestamp), "MMMM d, yyyy 'at' h:mm a")
        } catch (error) {
            console.error("Error formatting date:", error)
            return "Invalid date"
        }
    }

    function getStatusColor(status: string) {
        switch (status?.toLowerCase()) {
            case "completed":
                return "bg-green-100 text-green-800"
            case "shipped":
                return "bg-blue-100 text-blue-800"
            case "processing":
                return "bg-yellow-100 text-yellow-800"
            case "cancelled":
                return "bg-red-100 text-red-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex justify-between">
                    <Skeleton className="h-8 w-[200px]" />
                    <Skeleton className="h-6 w-[100px]" />
                </div>
                <Separator />
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex space-x-4">
                            <Skeleton className="h-20 w-20 rounded-md" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-[200px]" />
                                <Skeleton className="h-4 w-[150px]" />
                                <Skeleton className="h-4 w-[100px]" />
                            </div>
                        </div>
                    ))}
                </div>
                <Separator />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-6 w-[200px]" />
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900">Error</h3>
                <p className="mt-1 text-sm text-gray-500">{error}</p>
                <div className="mt-6">
                    <Link href="/dashboard/orders">
                        <Button>Back to Orders</Button>
                    </Link>
                </div>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900">Order not found</h3>
                <p className="mt-1 text-sm text-gray-500">
                    The order you're looking for doesn't exist or you don't have permission to view it.
                </p>
                <div className="mt-6">
                    <Link href="/dashboard/orders">
                        <Button>Back to Orders</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="divide-y divide-gray-200">
            {/* Order header */}
            <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                        <h2 className="text-lg font-medium text-gray-900">
                            Order #{order.orderNumber || order.id.slice(0, 8).toUpperCase()}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">Placed on {formatDate(order.createdAt)}</p>
                    </div>
                    <Badge className={getStatusColor(order.status)} variant="outline">
                        {order.status || "Processing"}
                    </Badge>
                </div>
            </div>

            {/* Order items */}
            <div className="p-6">
                <h3 className="text-base font-medium text-gray-900 mb-4">Items</h3>
                <div className="space-y-6">
                    {order.items?.map((item: any, index: number) => (
                        <div key={index} className="flex flex-col sm:flex-row gap-4">
                            <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                <Image
                                    src={
                                        item.product?.featuredImage || item.product?.images?.[0] || "/placeholder.svg?height=80&width=80"
                                    }
                                    alt={item.product?.name || "Product"}
                                    width={80}
                                    height={80}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900">{item.product?.name || "Product"}</h4>
                                <p className="mt-1 text-sm text-gray-500">Quantity: {item.quantity}</p>
                                <p className="mt-1 text-sm font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                                {item.product?.id && (
                                    <div className="mt-3">
                                        <Link href={`/products/${item.product.id}`}>
                                            <Button variant="outline" size="sm" className="mr-2">
                                                View Product
                                            </Button>
                                        </Link>
                                        <AddToCartButton product={item.product} variant="small" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Order summary */}
            <div className="p-6">
                <h3 className="text-base font-medium text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <p className="text-gray-500">Subtotal</p>
                        <p className="text-gray-900">${order.subtotal?.toFixed(2) || "0.00"}</p>
                    </div>
                    <div className="flex justify-between text-sm">
                        <p className="text-gray-500">Shipping</p>
                        <p className="text-gray-900">${order.shipping?.toFixed(2) || "0.00"}</p>
                    </div>
                    <div className="flex justify-between text-sm">
                        <p className="text-gray-500">Tax</p>
                        <p className="text-gray-900">${order.tax?.toFixed(2) || "0.00"}</p>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between">
                        <p className="font-medium text-gray-900">Total</p>
                        <p className="font-medium text-gray-900">${order.total?.toFixed(2) || "0.00"}</p>
                    </div>
                </div>
            </div>

            {/* Shipping information */}
            {order.shippingAddress && (
                <div className="p-6">
                    <h3 className="text-base font-medium text-gray-900 mb-4">Shipping Information</h3>
                    <div className="text-sm text-gray-500">
                        <p className="font-medium text-gray-900">
                            {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                        </p>
                        <p>{order.shippingAddress.address1}</p>
                        {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                        <p>
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                        </p>
                        <p>{order.shippingAddress.country}</p>
                        {order.shippingAddress.phone && <p>Phone: {order.shippingAddress.phone}</p>}
                    </div>
                </div>
            )}

            {/* Payment information */}
            {order.paymentMethod && (
                <div className="p-6">
                    <h3 className="text-base font-medium text-gray-900 mb-4">Payment Information</h3>
                    <div className="text-sm text-gray-500">
                        <p>Payment Method: {order.paymentMethod.type || "Credit Card"}</p>
                        {order.paymentMethod.last4 && <p>Card ending in {order.paymentMethod.last4}</p>}
                    </div>
                </div>
            )}
        </div>
    )
}
