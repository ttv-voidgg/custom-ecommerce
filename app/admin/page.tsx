"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Package, Users, ShoppingCart, Upload, Database, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { StoreHeader } from "@/components/store-header"

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [seeding, setSeeding] = useState(false)
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    loading: true,
  })

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/auth")
    }
  }, [user, isAdmin, loading, router])

  useEffect(() => {
    if (user && isAdmin) {
      loadStats()
    }
  }, [user, isAdmin])

  const loadStats = async () => {
    try {
      setStats((prev) => ({ ...prev, loading: true }))

      // Load products count
      const productsResponse = await fetch("/api/products")
      const productsResult = await productsResponse.json()

      console.log("Products API response:", productsResult)

      let customersCount = 0
      let ordersCount = 0

      // Load users count (customers) - only if Firebase is available
      try {
        const { db } = await import("@/lib/firebase")
        const { collection, getDocs, query, where } = await import("firebase/firestore")

        try {
          const usersRef = collection(db, "users")
          const customersQuery = query(usersRef, where("isAdmin", "!=", true))
          const customersSnapshot = await getDocs(customersQuery)
          customersCount = customersSnapshot.size
        } catch (error) {
          console.log("Could not load customers count:", error)
        }

        // Load orders count (if orders collection exists)
        try {
          const ordersRef = collection(db, "orders")
          const ordersSnapshot = await getDocs(ordersRef)
          ordersCount = ordersSnapshot.size
        } catch (error) {
          console.log("Could not load orders count:", error)
        }
      } catch (error) {
        console.log("Firebase import error:", error)
      }

      setStats({
        totalProducts: productsResult.success ? productsResult.count || 0 : 0,
        totalOrders: ordersCount,
        totalCustomers: customersCount,
        loading: false,
      })

      console.log("Stats updated:", {
        totalProducts: productsResult.success ? productsResult.count || 0 : 0,
        totalOrders: ordersCount,
        totalCustomers: customersCount,
      })
    } catch (error) {
      console.error("Error loading stats:", error)
      setStats((prev) => ({ ...prev, loading: false }))
    }
  }

  const seedProducts = async () => {
    setSeeding(true)
    try {
      const response = await fetch("/api/seed-products", {
        method: "POST",
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success!",
          description: result.message,
        })
        // Refresh stats after seeding
        loadStats()
      } else {
        toast({
          title: "Info",
          description: result.message,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to seed products",
        variant: "destructive",
      })
    } finally {
      setSeeding(false)
    }
  }

  if (loading) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <StoreHeader />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-light text-gray-900 tracking-wide">Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your jewelry store</p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/admin/products">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.loading ? (
                        <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
                    ) : (
                        stats.totalProducts
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Manage inventory</p>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/admin/orders">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.loading ? (
                        <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
                    ) : (
                        stats.totalOrders
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Process orders</p>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/admin/customers">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Customers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.loading ? (
                        <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
                    ) : (
                        stats.totalCustomers
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Customer management</p>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/admin/files">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">File Manager</CardTitle>
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Ready</div>
                  <p className="text-xs text-muted-foreground">Manage assets</p>
                </CardContent>
              </Link>
            </Card>
          </div>

          {/* Setup Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Database Setup</span>
                </CardTitle>
                <CardDescription>Initialize your store with sample products and data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={seedProducts} disabled={seeding} className="w-full">
                  {seeding ? "Seeding Products..." : "Seed Initial Products"}
                </Button>
                <p className="text-sm text-gray-600">
                  This will add sample jewelry products to your database with placeholder images.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Quick Links</span>
                </CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/admin/products/new" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    Add New Product
                  </Button>
                </Link>
                <Link href="/admin/files" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    Upload Images
                  </Button>
                </Link>
                <Link href="/admin/categories" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    Manage Categories
                  </Button>
                </Link>
                <Link href="/admin/orders" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    View Orders
                  </Button>
                </Link>
                <Link href="/admin/settings" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    Store Settings
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  )
}
