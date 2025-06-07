"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, ShoppingBag, User, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/contexts/cart-context"

interface StoreSettings {
    storeName: string
    logoUrl?: string
}

interface Category {
    id: string
    name: string
    slug: string
}

export function StoreHeader() {
    const { user, isAdmin, logout } = useAuth()
    const { items } = useCart()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [searchQuery, setSearchQuery] = useState("")
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [storeSettings, setStoreSettings] = useState<StoreSettings>({
        storeName: "Lumière",
    })
    const [categories, setCategories] = useState<Category[]>([])

    // Get cart item count
    const cartItemCount = items.reduce((total, item) => total + item.quantity, 0)

    // Load store settings
    useEffect(() => {
        const loadStoreSettings = async () => {
            try {
                const { db } = await import("@/lib/firebase")
                const { doc, getDoc } = await import("firebase/firestore")

                const settingsDoc = await getDoc(doc(db, "settings", "store"))
                if (settingsDoc.exists()) {
                    const data = settingsDoc.data()
                    setStoreSettings({
                        storeName: data.storeName || "Lumière",
                        logoUrl: data.logoUrl,
                    })
                }
            } catch (error) {
                console.error("Error loading store settings:", error)
            }
        }

        loadStoreSettings()
    }, [])

    // Load categories
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const { db } = await import("@/lib/firebase")
                const { collection, getDocs, orderBy, query } = await import("firebase/firestore")

                const categoriesRef = collection(db, "categories")
                const q = query(categoriesRef, orderBy("name"))
                const snapshot = await getDocs(q)

                const categoriesData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Category[]

                setCategories(categoriesData)
            } catch (error) {
                console.error("Error loading categories:", error)
            }
        }

        loadCategories()
    }, [])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
        }
    }

    const handleCategoryClick = (categorySlug: string) => {
        router.push(`/products?category=${categorySlug}`)
        setIsMenuOpen(false)
    }

    const handleLogout = async () => {
        try {
            await logout()
            router.push("/")
        } catch (error) {
            console.error("Logout error:", error)
        }
    }

    return (
        <header className="bg-white shadow-sm border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2">
                        {storeSettings.logoUrl ? (
                            <img
                                src={storeSettings.logoUrl || "/placeholder.svg"}
                                alt={storeSettings.storeName}
                                className="h-8 w-auto"
                            />
                        ) : (
                            <span className="text-2xl font-bold text-gray-900">{storeSettings.storeName}</span>
                        )}
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <Link href="/products" className="text-gray-700 hover:text-gray-900">
                            All Products
                        </Link>
                        {categories.slice(0, 4).map((category) => (
                            <button
                                key={category.id}
                                onClick={() => handleCategoryClick(category.slug)}
                                className="text-gray-700 hover:text-gray-900"
                            >
                                {category.name}
                            </button>
                        ))}
                    </nav>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-8">
                        <div className="relative w-full">
                            <Input
                                type="text"
                                placeholder="Search jewelry..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pr-10"
                            />
                            <Button
                                type="submit"
                                size="sm"
                                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                            >
                                <Search className="h-4 w-4" />
                            </Button>
                        </div>
                    </form>

                    {/* Right Side Actions */}
                    <div className="flex items-center space-x-4">
                        {/* Cart */}
                        <Link href="/cart" className="relative">
                            <Button variant="ghost" size="sm" className="relative">
                                <ShoppingBag className="h-5 w-5" />
                                {cartItemCount > 0 && (
                                    <Badge
                                        variant="destructive"
                                        className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0"
                                    >
                                        {cartItemCount}
                                    </Badge>
                                )}
                            </Button>
                        </Link>

                        {/* User Menu */}
                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <User className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <div className="px-2 py-1.5 text-sm font-medium">{user.firstName || user.email}</div>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard">Dashboard</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/orders">Orders</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/app/dashboard/wishlist">Wishlist</Link>
                                    </DropdownMenuItem>
                                    {isAdmin && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem asChild>
                                                <Link href="/admin">Admin Panel</Link>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout}>Sign Out</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/auth">Sign In</Link>
                            </Button>
                        )}

                        {/* Mobile Menu Button */}
                        <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden border-t bg-white">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {/* Mobile Search */}
                            <form onSubmit={handleSearch} className="mb-4">
                                <div className="relative">
                                    <Input
                                        type="text"
                                        placeholder="Search jewelry..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pr-10"
                                    />
                                    <Button
                                        type="submit"
                                        size="sm"
                                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                                    >
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </div>
                            </form>

                            {/* Mobile Navigation */}
                            <Link
                                href="/products"
                                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                All Products
                            </Link>
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => handleCategoryClick(category.slug)}
                                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </header>
    )
}
