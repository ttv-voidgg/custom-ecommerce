"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { ProductForm } from "@/components/admin/product-form"

interface EditProductPageProps {
    params: {
        id: string
    }
}

export default function EditProductPage({ params }: EditProductPageProps) {
    const { user, isAdmin, loading } = useAuth()
    const router = useRouter()
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [loadingProduct, setLoadingProduct] = useState(true)
    const [product, setProduct] = useState<any>(null)

    useEffect(() => {
        if (!loading && (!user || !isAdmin)) {
            router.push("/auth")
        }
    }, [user, isAdmin, loading, router])

    useEffect(() => {
        if (user && isAdmin && params.id) {
            loadProduct()
        }
    }, [user, isAdmin, params.id])

    const loadProduct = async () => {
        setLoadingProduct(true)
        try {
            console.log(`Fetching product with ID: ${params.id}`)
            const response = await fetch(`/api/products/${params.id}`)
            const result = await response.json()
            console.log("API response:", result)

            if (result.success) {
                setProduct(result.product)
                console.log("Product loaded successfully:", result.product.name)
            } else {
                throw new Error(result.error || "Failed to load product")
            }
        } catch (error: any) {
            console.error("Error loading product:", error)
            toast({
                title: "Error",
                description: "Failed to load product",
                variant: "destructive",
            })
            router.push("/admin/products")
        } finally {
            setLoadingProduct(false)
        }
    }

    const handleSubmit = async (productData: any) => {
        setIsSubmitting(true)
        try {
            console.log(`Updating product with ID: ${params.id}`, productData)
            const response = await fetch(`/api/products/${params.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(productData),
            })

            const result = await response.json()
            console.log("Update response:", result)

            if (result.success) {
                toast({
                    title: "Success!",
                    description: "Product updated successfully",
                })
                router.push("/admin/products")
            } else {
                throw new Error(result.error || "Failed to update product")
            }
        } catch (error: any) {
            console.error("Error updating product:", error)
            toast({
                title: "Error",
                description: error.message || "Failed to update product",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading || loadingProduct) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading product...</p>
                </div>
            </div>
        )
    }

    if (!user || !isAdmin || !product) {
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
                            <h1 className="text-xl font-light tracking-wide text-gray-900">Edit Product</h1>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ProductForm
                    initialData={product}
                    onSubmit={handleSubmit}
                    isLoading={isSubmitting}
                    submitLabel="Update Product"
                />
            </div>
        </div>
    )
}
