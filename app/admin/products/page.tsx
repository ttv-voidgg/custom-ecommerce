"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Plus, Search, Edit, Trash2, ArrowLeft, Eye, Star, ChevronUp, ChevronDown, Tag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

interface Product {
    id: string
    name: string
    description: string
    price: number
    originalPrice?: number
    category: string
    images: string[]
    featuredImage?: string
    inStock: boolean
    stockQuantity: number
    rating: number
    reviews: number
    featured: boolean
    tags: string[]
    specifications: Record<string, any>
    createdAt: any
    updatedAt: any
}

interface Category {
    id: string
    name: string
    slug: string
    description: string
}

type SortField = "name" | "category" | "price" | "stockQuantity" | "rating" | "createdAt"
type SortDirection = "asc" | "desc"

export default function AdminProductsPage() {
    const { user, isAdmin, loading } = useAuth()
    const router = useRouter()
    const { toast } = useToast()

    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
    const [loadingProducts, setLoadingProducts] = useState(true)
    const [loadingCategories, setLoadingCategories] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [sortField, setSortField] = useState<SortField>("createdAt")
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

    useEffect(() => {
        if (!loading && (!user || !isAdmin)) {
            router.push("/auth")
        }
    }, [user, isAdmin, loading, router])

    useEffect(() => {
        if (user && isAdmin) {
            loadProducts()
            loadCategories()
        }
    }, [user, isAdmin])

    useEffect(() => {
        filterAndSortProducts()
    }, [products, searchQuery, categoryFilter, statusFilter, sortField, sortDirection])

    const loadProducts = async () => {
        setLoadingProducts(true)
        try {
            console.log("Fetching products from API...")
            const response = await fetch("/api/products")
            const result = await response.json()
            console.log("API response:", result)

            if (result.success) {
                setProducts(result.products)
                console.log(`Loaded ${result.products.length} products successfully`)
            } else {
                throw new Error(result.error || "Failed to load products")
            }
        } catch (error) {
            console.error("Error loading products:", error)
            toast({
                title: "Error",
                description: "Failed to load products",
                variant: "destructive",
            })
        } finally {
            setLoadingProducts(false)
        }
    }

    const loadCategories = async () => {
        setLoadingCategories(true)
        try {
            console.log("Fetching categories from API...")
            const response = await fetch("/api/categories")
            const result = await response.json()
            console.log("Categories API response:", result)

            if (result.success) {
                setCategories(result.categories)
                console.log(`Loaded ${result.categories.length} categories successfully`)
            } else {
                throw new Error(result.error || "Failed to load categories")
            }
        } catch (error) {
            console.error("Error loading categories:", error)
            toast({
                title: "Error",
                description: "Failed to load categories",
                variant: "destructive",
            })
        } finally {
            setLoadingCategories(false)
        }
    }

    const filterAndSortProducts = () => {
        let filtered = [...products]

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(
                (product) =>
                    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (product.tags && product.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))),
            )
        }

        // Category filter
        if (categoryFilter !== "all") {
            filtered = filtered.filter((product) => product.category === categoryFilter)
        }

        // Status filter
        if (statusFilter === "inStock") {
            filtered = filtered.filter((product) => product.inStock)
        } else if (statusFilter === "outOfStock") {
            filtered = filtered.filter((product) => !product.inStock)
        } else if (statusFilter === "featured") {
            filtered = filtered.filter((product) => product.featured)
        }

        // Sort products
        filtered.sort((a, b) => {
            let aValue: any
            let bValue: any

            switch (sortField) {
                case "name":
                    aValue = a.name.toLowerCase()
                    bValue = b.name.toLowerCase()
                    break
                case "category":
                    // Find category name for display
                    const aCat = categories.find((cat) => cat.slug === a.category)
                    const bCat = categories.find((cat) => cat.slug === b.category)
                    aValue = aCat?.name.toLowerCase() || a.category.toLowerCase()
                    bValue = bCat?.name.toLowerCase() || b.category.toLowerCase()
                    break
                case "price":
                    aValue = a.price
                    bValue = b.price
                    break
                case "stockQuantity":
                    aValue = a.stockQuantity
                    bValue = b.stockQuantity
                    break
                case "rating":
                    aValue = a.rating
                    bValue = b.rating
                    break
                case "createdAt":
                    aValue = a.createdAt?.seconds || 0
                    bValue = b.createdAt?.seconds || 0
                    break
                default:
                    aValue = a.name.toLowerCase()
                    bValue = b.name.toLowerCase()
            }

            if (aValue < bValue) {
                return sortDirection === "asc" ? -1 : 1
            }
            if (aValue > bValue) {
                return sortDirection === "asc" ? 1 : -1
            }
            return 0
        })

        setFilteredProducts(filtered)
    }

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            // Toggle direction if same field
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            // Set new field with default direction
            setSortField(field)
            setSortDirection("asc")
        }
    }

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return <ChevronUp className="h-4 w-4 text-gray-300" />
        }
        return sortDirection === "asc" ? (
            <ChevronUp className="h-4 w-4 text-gray-600" />
        ) : (
            <ChevronDown className="h-4 w-4 text-gray-600" />
        )
    }

    const handleDeleteProduct = async (productId: string, productName: string) => {
        if (!confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
            return
        }

        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: "DELETE",
            })

            const result = await response.json()

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Product deleted successfully",
                })
                loadProducts() // Refresh the list
            } else {
                throw new Error(result.error || "Failed to delete product")
            }
        } catch (error) {
            console.error("Error deleting product:", error)
            toast({
                title: "Error",
                description: "Failed to delete product",
                variant: "destructive",
            })
        }
    }

    // Helper function to get the display image (featured image or first image)
    const getDisplayImage = (product: Product) => {
        if (product.featuredImage) {
            return product.featuredImage
        }
        if (product.images && product.images.length > 0) {
            return product.images[0]
        }
        return "/placeholder.svg?height=60&width=60"
    }

    // Helper function to get category name from slug
    const getCategoryName = (categorySlug: string) => {
        const category = categories.find((cat) => cat.slug === categorySlug)
        return category?.name || categorySlug
    }

    if (loading || loadingProducts) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading products...</p>
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
                            <Button variant="ghost" size="sm" onClick={() => router.push("/admin")}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Button>
                            <h1 className="text-xl font-light tracking-wide text-gray-900">Product Management</h1>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Link href="/admin/categories">
                                <Button variant="outline" size="sm">
                                    <Tag className="h-4 w-4 mr-2" />
                                    Manage Categories
                                </Button>
                            </Link>
                            <Link href="/admin/products/new">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Product
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-600">Total Products</p>
                                    <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-600">In Stock</p>
                                    <p className="text-2xl font-bold text-green-600">{products.filter((p) => p.inStock).length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                                    <p className="text-2xl font-bold text-red-600">{products.filter((p) => !p.inStock).length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-600">Featured</p>
                                    <p className="text-2xl font-bold text-blue-600">{products.filter((p) => p.featured).length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                        <CardDescription>Search and filter your products</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        placeholder="Search products..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-full md:w-48">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {loadingCategories ? (
                                        <SelectItem value="loading" disabled>
                                            Loading categories...
                                        </SelectItem>
                                    ) : (
                                        categories.map((category) => (
                                            <SelectItem key={category.id} value={category.slug}>
                                                {category.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-48">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="inStock">In Stock</SelectItem>
                                    <SelectItem value="outOfStock">Out of Stock</SelectItem>
                                    <SelectItem value="featured">Featured</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Products Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Products ({filteredProducts.length})</CardTitle>
                        <CardDescription>Manage your jewelry inventory</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {filteredProducts.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 mb-4">
                                    {products.length === 0
                                        ? "No products found. Create your first product!"
                                        : "No products match your filters."}
                                </p>
                                {products.length === 0 && (
                                    <Link href="/admin/products/new">
                                        <Button>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Your First Product
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                    <tr className="border-b">
                                        <th
                                            className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                                            onClick={() => handleSort("name")}
                                        >
                                            <div className="flex items-center space-x-1">
                                                <span>Product</span>
                                                {getSortIcon("name")}
                                            </div>
                                        </th>
                                        <th
                                            className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                                            onClick={() => handleSort("category")}
                                        >
                                            <div className="flex items-center space-x-1">
                                                <span>Category</span>
                                                {getSortIcon("category")}
                                            </div>
                                        </th>
                                        <th
                                            className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                                            onClick={() => handleSort("price")}
                                        >
                                            <div className="flex items-center space-x-1">
                                                <span>Price</span>
                                                {getSortIcon("price")}
                                            </div>
                                        </th>
                                        <th
                                            className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                                            onClick={() => handleSort("stockQuantity")}
                                        >
                                            <div className="flex items-center space-x-1">
                                                <span>Stock</span>
                                                {getSortIcon("stockQuantity")}
                                            </div>
                                        </th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                                        <th
                                            className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                                            onClick={() => handleSort("rating")}
                                        >
                                            <div className="flex items-center space-x-1">
                                                <span>Rating</span>
                                                {getSortIcon("rating")}
                                            </div>
                                        </th>
                                        <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {filteredProducts.map((product) => (
                                        <tr key={product.id} className="border-b hover:bg-gray-50">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex-shrink-0 relative">
                                                        <Image
                                                            src={getDisplayImage(product) || "/placeholder.svg"}
                                                            alt={product.name}
                                                            width={60}
                                                            height={60}
                                                            className="rounded-lg object-cover"
                                                        />
                                                        {/* Featured image indicator */}
                                                        {product.featuredImage && (
                                                            <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                                                                <Star className="h-3 w-3 text-white fill-current" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{product.name}</p>
                                                        <p className="text-sm text-gray-500 line-clamp-1">{product.description}</p>
                                                        <div className="flex items-center space-x-2 mt-1">
                                                            {product.featured && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    Featured
                                                                </Badge>
                                                            )}
                                                            {product.tags &&
                                                                product.tags.slice(0, 2).map((tag) => (
                                                                    <Badge key={tag} variant="outline" className="text-xs">
                                                                        {tag}
                                                                    </Badge>
                                                                ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <Badge variant="outline" className="capitalize">
                                                    {getCategoryName(product.category)}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">${product.price.toLocaleString()}</p>
                                                    {product.originalPrice && (
                                                        <p className="text-sm text-gray-500 line-through">
                                                            ${product.originalPrice.toLocaleString()}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className="text-sm text-gray-900">{product.stockQuantity} units</p>
                                            </td>
                                            <td className="py-4 px-4">
                                                <Badge variant={product.inStock ? "default" : "destructive"}>
                                                    {product.inStock ? "In Stock" : "Out of Stock"}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center space-x-1">
                                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                    <span className="text-sm text-gray-900">{product.rating}</span>
                                                    <span className="text-sm text-gray-500">({product.reviews})</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Link href={`/products/${product.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/admin/products/${product.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteProduct(product.id, product.name)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
