"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Search, ShoppingBag, User, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/contexts/cart-contexts"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface StoreSettings {
    name: string
    logoUrl: string
}

export function StoreHeader() {
    const { user, isAdmin, logout } = useAuth()
    const { totalItems } = useCart()
    const [settings, setSettings] = useState<StoreSettings>({
        name: "LUMIÈRE",
        logoUrl: "",
    })

    useEffect(() => {
        loadStoreSettings()
    }, [])

    const loadStoreSettings = async () => {
        try {
            const { db } = await import("@/lib/firebase")
            const { doc, getDoc } = await import("firebase/firestore")

            const storeDoc = await getDoc(doc(db, "settings", "store"))
            if (storeDoc.exists()) {
                const data = storeDoc.data()
                setSettings({
                    name: data.name || "LUMIÈRE",
                    logoUrl: data.logoUrl || "",
                })
            } else {
                // If no settings document exists, use defaults
                setSettings({
                    name: "LUMIÈRE",
                    logoUrl: "",
                })
            }
        } catch (error) {
            console.error("Error loading store settings:", error)
            // Fallback to defaults on error
            setSettings({
                name: "LUMIÈRE",
                logoUrl: "",
            })
        }
    }

    const getDisplayName = () => {
        if (!user) return ""
        if (user.firstName) {
            return user.firstName
        }
        // Fallback to email if no first name
        return user.email?.split("@")[0] || "User"
    }

    return (
        <header className="absolute top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link href="/" className="flex items-center space-x-3">
                        {settings.logoUrl ? (
                            <Image
                                src={settings.logoUrl || "/placeholder.svg"}
                                alt={settings.name}
                                width={120}
                                height={40}
                                className="h-8 w-auto object-contain"
                            />
                        ) : (
                            <span className="text-xl font-light tracking-widest text-gray-900">{settings.name}</span>
                        )}
                    </Link>

                    <nav className="hidden md:flex space-x-8 ml-8">
                        {isAdmin && typeof window !== "undefined" && window.location.pathname.startsWith("/admin") ? (
                            // Admin navigation
                            <>
                                <Link href="/admin" className="text-sm font-medium text-gray-900">
                                    Dashboard
                                </Link>
                                <Link
                                    href="/admin/products"
                                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                                >
                                    Products
                                </Link>
                                <Link
                                    href="/admin/categories"
                                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                                >
                                    Categories
                                </Link>
                                <Link
                                    href="/admin/orders"
                                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                                >
                                    Orders
                                </Link>
                            </>
                        ) : (
                            // Store navigation
                            <>
                                <Link href="/products" className="text-sm font-medium text-gray-900">
                                    All Products
                                </Link>
                                <Link
                                    href="/products?category=rings"
                                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                                >
                                    Rings
                                </Link>
                                <Link
                                    href="/products?category=necklaces"
                                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                                >
                                    Necklaces
                                </Link>
                                <Link
                                    href="/products?category=earrings"
                                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                                >
                                    Earrings
                                </Link>
                                <Link
                                    href="/products?category=bracelets"
                                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                                >
                                    Bracelets
                                </Link>
                            </>
                        )}
                    </nav>

                    <div className="flex items-center space-x-3">
                        <Button variant="ghost" size="icon" className="hover:bg-white/50">
                            <Search className="h-5 w-5" />
                        </Button>

                        {user ? (
                            <div className="flex items-center space-x-2">
                                {isAdmin && (
                                    <Link href="/admin">
                                        <Button variant="ghost" size="sm" className="text-xs">
                                            ADMIN
                                        </Button>
                                    </Link>
                                )}
                                {isAdmin && typeof window !== "undefined" && window.location.pathname.startsWith("/admin") && (
                                    <Link href="/">
                                        <Button variant="outline" size="sm">
                                            View Store
                                        </Button>
                                    </Link>
                                )}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="hover:bg-white/50 text-sm">
                                            Welcome, {getDisplayName()}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem disabled className="font-medium">
                                            {user.email}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link href="/dashboard" className="w-full">
                                                <User className="mr-2 h-4 w-4" />
                                                Profile
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/orders" className="w-full">
                                                <ShoppingBag className="mr-2 h-4 w-4" />
                                                My Orders
                                            </Link>
                                        </DropdownMenuItem>
                                        {isAdmin && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem asChild>
                                                    <Link href="/admin" className="w-full">
                                                        <User className="mr-2 h-4 w-4" />
                                                        Admin Dashboard
                                                    </Link>
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={async () => {
                                                try {
                                                    await logout()
                                                } catch (error) {
                                                    console.error("Logout error:", error)
                                                }
                                            }}
                                            className="text-red-600 focus:text-red-600"
                                        >
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Sign Out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ) : (
                            <Link href="/auth">
                                <Button variant="ghost" size="icon" className="hover:bg-white/50">
                                    <User className="h-5 w-5" />
                                </Button>
                            </Link>
                        )}

                        <Link href="/cart">
                            <Button variant="ghost" size="icon" className="relative hover:bg-white/50">
                                <ShoppingBag className="h-5 w-5" />
                                {totalItems > 0 && (
                                    <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-gray-900">
                                        {totalItems}
                                    </Badge>
                                )}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    )
}
