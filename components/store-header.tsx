"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Search, ShoppingBag, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"

interface StoreSettings {
    name: string
    logoUrl: string
}

export function StoreHeader() {
    const { user, isAdmin } = useAuth()
    const [settings, setSettings] = useState<StoreSettings>({
        name: "LUMIÈRE",
        logoUrl: "",
    })
    const [cartItems, setCartItems] = useState(0)

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
            }
        } catch (error) {
            console.error("Error loading store settings:", error)
        }
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
                                <Button variant="ghost" size="icon" className="hover:bg-white/50">
                                    <User className="h-5 w-5" />
                                </Button>
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
                                {cartItems > 0 && (
                                    <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-gray-900">
                                        {cartItems}
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
