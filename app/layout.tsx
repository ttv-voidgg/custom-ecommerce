import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/hooks/use-auth"
import { CartProvider } from "@/contexts/cart-contexts"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "Jewellery Store - Luxury Jewelry",
    description: "Timeless elegance in every piece",
    openGraph: {
        title: "Jewellery Store - Luxury Jewelry",
        description: "Timeless elegance in every piece",
        images: [
            {
                url: "https://ecommerce.eejay.me/ecommerce.png", // Replace with your actual image URL
                width: 1200,
                height: 630,
                alt: "Jewellery Store Preview",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Jewellery Store - Luxury Jewelry",
        description: "Timeless elegance in every piece",
        images: ["https://ecommerce.eejay.me/ecommerce.png"],
    },
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
