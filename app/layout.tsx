import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/hooks/use-auth"
import { CartProvider } from "@/contexts/cart-contexts"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "Lumière - Luxury Jewelry",
    description: "Timeless elegance in every piece",
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
        <body className={inter.className}>
        <AuthProvider>
            <CartProvider>
                {children}
                <Toaster />
            </CartProvider>
        </AuthProvider>
        </body>
        </html>
    )
}
