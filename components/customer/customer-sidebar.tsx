"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"
import { cn } from "@/lib/utils"
import { User, ShoppingBag, MapPin, Heart, Settings, LogOut } from "lucide-react"

export function CustomerSidebar() {
    const pathname = usePathname()
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser)
        })

        return () => unsubscribe()
    }, [])

    const signOut = async () => {
        try {
            await auth.signOut()
            window.location.href = "/"
        } catch (error) {
            console.error("Error signing out:", error)
        }
    }

    const links = [
        {
            name: "Profile",
            href: "/dashboard",
            icon: User,
            exact: true,
        },
        {
            name: "Orders",
            href: "/dashboard/orders",
            icon: ShoppingBag,
        },
        {
            name: "Addresses",
            href: "/dashboard/addresses",
            icon: MapPin,
        },
        {
            name: "Wishlist",
            href: "/dashboard/wishlist",
            icon: Heart,
        },
        {
            name: "Settings",
            href: "/dashboard/settings",
            icon: Settings,
        },
    ]

    return (
        <div className="hidden md:flex h-full w-64 flex-col bg-white border-r">
            <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
                <div className="flex flex-col items-center flex-shrink-0 px-4 mb-5">
                    <div className="w-full">
                        <h2 className="text-xl font-semibold">My Account</h2>
                        {user && <p className="text-sm text-gray-500 mt-1 truncate">{user.email}</p>}
                    </div>
                </div>
                <nav className="flex-1 px-2 pb-4 space-y-1">
                    {links.map((link) => {
                        const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href)

                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(
                                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                                    isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                                )}
                            >
                                <link.icon
                                    className={cn(
                                        "mr-3 flex-shrink-0 h-5 w-5",
                                        isActive ? "text-gray-500" : "text-gray-400 group-hover:text-gray-500",
                                    )}
                                    aria-hidden="true"
                                />
                                {link.name}
                            </Link>
                        )
                    })}
                    <button
                        onClick={signOut}
                        className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                        <LogOut className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                        Sign Out
                    </button>
                </nav>
            </div>
        </div>
    )
}
