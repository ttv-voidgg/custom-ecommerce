"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface Order {
    id: string
    orderNumber: string
    date: any
    status: string
    total: number
    items: number
}

interface OrdersListProps {
    userId: string
}

export function OrdersList({ userId }: OrdersListProps) {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchOrders() {
            try {
                const { db } = await import("@/lib/firebase")
                const { collection, query, where, orderBy, getDocs } = await import("firebase/firestore")

                const ordersRef = collection(db, "orders")
                const q = query(ordersRef, where("userId", "==", userId), orderBy("createdAt", "desc"))

                const querySnapshot = await getDocs(q)
                const ordersData = querySnapshot.docs.map((doc) => {
                    const data = doc.data()
                    return {
                        id: doc.id,
                        orderNumber: data.orderNumber || doc.id.slice(0, 8).toUpperCase(),
                        date: data.createdAt,
                        status: data.status || "processing",
                        total: data.total || 0,
                        items: data.items?.length || 0,
                    }
                })

                setOrders(ordersData)
            } catch (error) {
                console.error("Error fetching orders:", error)
            } finally {
                setLoading(false)
            }
        }

        if (userId) {
            fetchOrders()
        }
    }, [userId])

    function formatDate(timestamp: any) {
        if (!timestamp) return "N/A"

        try {
            // Handle Firestore Timestamp
            if (timestamp.toDate) {
                return format(timestamp.toDate(), "MMM d, yyyy")
            }

            // Handle regular date
            return format(new Date(timestamp), "MMM d, yyyy")
        } catch (error) {
            console.error("Error formatting date:", error)
            return "Invalid date"
        }
    }

    function getStatusColor(status: string) {
        switch (status.toLowerCase()) {
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
            <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex flex-col space-y-3">
                        <div className="flex justify-between">
                            <Skeleton className="h-6 w-[200px]" />
                            <Skeleton className="h-6 w-[100px]" />
                        </div>
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-[150px]" />
                            <Skeleton className="h-4 w-[80px]" />
                        </div>
                        <Skeleton className="h-12 w-full" />
                    </div>
                ))}
            </div>
        )
    }

    if (orders.length === 0) {
        return (
            <div className="p-8 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Package className="h-6 w-6 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No orders yet</h3>
                <p className="mt-1 text-sm text-gray-500">When you place an order, it will appear here.</p>
                <div className="mt-6">
                    <Link href="/products">
                        <Button>Browse Products</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Order</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Total</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">#{order.orderNumber}</div>
                            <div className="text-sm text-gray-500">{order.items} items</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(order.date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getStatusColor(order.status)} variant="outline">
                                {order.status}
                            </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${order.total.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link href={`/dashboard/orders/${order.id}`}>
                                <Button variant="outline" size="sm">
                                    View Details
                                </Button>
                            </Link>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
}
