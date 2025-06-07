"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { ProductForm } from "@/components/admin/product-form"

export default function NewProductPage() {
    const { user, isAdmin, loading } = useAuth()
    const router = useRouter()
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (!loading && (!user || !isAdmin)) {
            router.push("/auth")
        }
    }, [user, isAdmin, loading, router])

    const handleSubmit = async (productData: any) => {
        setIsSubmitting(true)
        try {
            const response = await fetch("/api/products", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(productData),
            })

            const result = await response.json()

            if (result.success) {
                toast({
                    title: "Success!",
                    description: "Product created successfully",
                })
                router.push("/admin/products")
            } else {
                throw new Error(result.error || "Failed to create product")
            }
        } catch (error: any) {
            console.error("Error creating product:", error)
            toast({
                title: "Error",
                description: error.message || "Failed to create product",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <Button variant="ghost" size="sm" onClick={() => router.push("/admin/products")}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Products
                            </Button>
                            <h1 className="text-xl font-light tracking-wide text-gray-900">Add New Product</h1>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ProductForm onSubmit={handleSubmit} isLoading={isSubmitting} submitLabel="Create Product" />
            </div>
        </div>
    )
}
