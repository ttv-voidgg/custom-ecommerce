"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { auth } from "@/lib/firebase"
import { cn } from "@/lib/utils"
import { User, ShoppingBag, MapPin, Heart, Settings, LogOut, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export function MobileNav() {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)

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
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <button className="flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                    <Menu className="h-6 w-6" />
                    <span className="ml-2 text-sm font-medium">Menu</span>
                </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                <SheetHeader>
                    <SheetTitle>My Account</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                    <nav className="space-y-1">
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
                                    onClick={() => setOpen(false)}
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
                            onClick={() => {
                                signOut()
                                setOpen(false)
                            }}
                            className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        >
                            <LogOut
                                className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500"
                                aria-hidden="true"
                            />
                            Sign Out
                        </button>
                    </nav>
                </div>
            </SheetContent>
        </Sheet>
    )
}
