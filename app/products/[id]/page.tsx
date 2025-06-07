"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Star, Share2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { StoreHeader } from "@/components/store-header"
import { AddToCartButton } from "@/components/add-to-cart-button"
import { AddToWishlistButton } from "@/components/add-to-wishlist-button"

export default function ProductDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { user, isAdmin } = useAuth()
    const { toast } = useToast()
    const productId = params.id as string

    const [product, setProduct] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [selectedImage, setSelectedImage] = useState(0)
    const [relatedProducts, setRelatedProducts] = useState<any[]>([])

    useEffect(() => {
        if (productId) {
            loadProduct()
        }
    }, [productId])

    useEffect(() => {
        if (product) {
            loadRelatedProducts()
        }
    }, [product])

    const loadProduct = async () => {
        try {
            const response = await fetch(`/api/products/${productId}`)
            const data = await response.json()

            if (data.success) {
                setProduct(data.product)
            } else {
                toast({
                    title: "Error",
                    description: "Product not found",
                    variant: "destructive",
                })
                router.push("/products")
            }
        } catch (error) {
            console.error("Error loading product:", error)
            toast({
                title: "Error",
                description: "Failed to load product",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const loadRelatedProducts = async () => {
        try {
            const response = await fetch(`/api/products?category=${product.category}`)
            const data = await response.json()

            if (data.success) {
                // Filter out current product and limit to 4 related products
                const related = data.products.filter((p: any) => p.id !== productId).slice(0, 4)
                setRelatedProducts(related)
            }
        } catch (error) {
            console.error("Error loading related products:", error)
        }
    }

    const shareProduct = () => {
        if (navigator.share) {
            navigator.share({
                title: product.name,
                text: product.description,
                url: window.location.href,
            })
        } else {
            navigator.clipboard.writeText(window.location.href)
            toast({
                title: "Link Copied",
                description: "Product link copied to clipboard",
            })
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white pt-16">
                {/* Header */}
                <StoreHeader />

                {/* Loading State */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <div className="bg-gray-200 h-96 rounded-lg animate-pulse"></div>
                            <div className="grid grid-cols-4 gap-2">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="bg-gray-200 h-20 rounded-lg animate-pulse"></div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="bg-gray-200 h-8 rounded w-3/4 animate-pulse"></div>
                                <div className="bg-gray-200 h-6 rounded w-1/2 animate-pulse"></div>
                                <div className="bg-gray-200 h-20 rounded animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-medium text-gray-900 mb-4">Product Not Found</h1>
                    <Link href="/products">
                        <Button>Back to Products</Button>
                    </Link>
                </div>
            </div>
        )
    }

    const images = product.images || []
    const currentImage = images[selectedImage] || product.featuredImage || images[0]

    return (
        <div className="min-h-screen bg-white pt-16">
            {/* Header */}
            <StoreHeader />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
                    <Link href="/" className="hover:text-gray-900">
                        Home
                    </Link>
                    <span>/</span>
                    <Link href="/products" className="hover:text-gray-900">
                        Products
                    </Link>
                    <span>/</span>
                    <Link href={`/products?category=${product.category}`} className="hover:text-gray-900 capitalize">
                        {product.category}
                    </Link>
                    <span>/</span>
                    <span className="text-gray-900">{product.name}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Product Images */}
                    <div className="space-y-4">
                        {/* Main Image */}
                        <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                            <Image
                                src={
                                    currentImage || `/placeholder.svg?height=600&width=600&query=jewelry ${product.category || "elegant"}`
                                }
                                alt={product.name}
                                fill
                                className="object-cover"
                                priority
                            />
                            <Button
                                variant="secondary"
                                size="icon"
                                className="absolute top-4 right-4 bg-white/80 hover:bg-white"
                                onClick={shareProduct}
                            >
                                <Share2 className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Thumbnail Images */}
                        {images.length > 1 && (
                            <div className="grid grid-cols-4 gap-2">
                                {images.map((image: string, index: number) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(index)}
                                        className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                                            selectedImage === index ? "border-gray-900" : "border-gray-200 hover:border-gray-300"
                                        }`}
                                    >
                                        <Image
                                            src={image || `/placeholder.svg?height=150&width=150&query=jewelry`}
                                            alt={`${product.name} ${index + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-6">
                        {/* Header */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Badge variant="secondary" className="capitalize">
                                    {product.category}
                                </Badge>
                                {product.featured && <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>}
                            </div>
                            <h1 className="text-3xl font-light text-gray-900 mb-2">{product.name}</h1>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-4 w-4 ${
                                                i < Math.floor(product.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                            }`}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm text-gray-500">({product.reviews || 0} reviews)</span>
                            </div>
                        </div>

                        {/* Price */}
                        <div className="flex items-center space-x-4">
                            <span className="text-3xl font-light text-gray-900">${product.price?.toLocaleString()}</span>
                            {product.originalPrice && (
                                <span className="text-xl text-gray-500 line-through">${product.originalPrice.toLocaleString()}</span>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                            <p className="text-gray-600 leading-relaxed">{product.description}</p>
                        </div>

                        {/* Specifications */}
                        {product.specifications && Object.keys(product.specifications).length > 0 && (
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Specifications</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {Object.entries(product.specifications).map(([key, value]) => (
                                        <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                                            <span className="text-sm text-gray-900">{value as string}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Stock Status */}
                        <div className="flex items-center space-x-2">
                            <div className={`h-2 w-2 rounded-full ${product.inStock ? "bg-green-500" : "bg-red-500"}`}></div>
                            <span className={`text-sm ${product.inStock ? "text-green-600" : "text-red-600"}`}>
                {product.inStock ? `In Stock (${product.stockQuantity || 0} available)` : "Out of Stock"}
              </span>
                        </div>

                        {/* Add to Cart and Favorite */}
                        <div className="flex space-x-4">
                            <div className="flex-1">
                                <AddToCartButton
                                    product={product}
                                    variant="full"
                                    showQuantitySelector={true}
                                    disabled={!product.inStock}
                                />
                            </div>
                            <AddToWishlistButton productId={productId} />
                        </div>

                        {/* Tags */}
                        {product.tags && product.tags.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-2">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {product.tags.map((tag: string, index: number) => (
                                        <Badge key={index} variant="outline" className="capitalize">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="mt-16">
                        <h2 className="text-2xl font-light text-gray-900 mb-8">Related Products</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedProducts.map((relatedProduct) => (
                                <Card
                                    key={relatedProduct.id}
                                    className="group cursor-pointer border-0 shadow-sm hover:shadow-lg transition-all duration-300"
                                >
                                    <CardContent className="p-0">
                                        <Link href={`/products/${relatedProduct.id}`}>
                                            <div className="relative overflow-hidden">
                                                <Image
                                                    src={
                                                        relatedProduct.featuredImage ||
                                                        relatedProduct.images?.[0] ||
                                                        `/placeholder.svg?height=300&width=300&query=jewelry ${relatedProduct.category || "/placeholder.svg"}`
                                                    }
                                                    alt={relatedProduct.name}
                                                    width={300}
                                                    height={300}
                                                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>
                                            <div className="p-4 space-y-2">
                                                <h4 className="text-lg font-medium text-gray-900">{relatedProduct.name}</h4>
                                                <p className="text-xl font-light text-gray-900">${relatedProduct.price?.toLocaleString()}</p>
                                            </div>
                                        </Link>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
