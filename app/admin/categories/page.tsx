"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Edit, Trash2, ArrowLeft, Package, ChevronUp, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { CategoryForm } from "@/components/admin/category-form"
import { DeleteCategoryModal } from "@/components/admin/delete-category-modal"

interface Category {
    id: string
    name: string
    description: string
    slug: string
    createdAt: any
    updatedAt: any
    featured: boolean
}

type SortField = "name" | "slug" | "productCount" | "createdAt"
type SortDirection = "asc" | "desc"

export default function AdminCategoriesPage() {
    const { user, isAdmin, loading } = useAuth()
    const router = useRouter()
    const { toast } = useToast()

    const [categories, setCategories] = useState<Category[]>([])
    const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
    const [loadingCategories, setLoadingCategories] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
    const [productCounts, setProductCounts] = useState<Record<string, number>>({})
    const [sortField, setSortField] = useState<SortField>("name")
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
    const [featuredCount, setFeaturedCount] = useState(0)

    useEffect(() => {
        if (!loading && (!user || !isAdmin)) {
            router.push("/auth")
        }
    }, [user, isAdmin, loading, router])

    useEffect(() => {
        if (user && isAdmin) {
            loadCategories()
        }
    }, [user, isAdmin])

    useEffect(() => {
        if (categories.length > 0) {
            loadProductCounts()
            // Count featured categories
            const featured = categories.filter((cat) => cat.featured).length
            setFeaturedCount(featured)
        }
    }, [categories])

    useEffect(() => {
        filterAndSortCategories()
    }, [categories, searchQuery, sortField, sortDirection, productCounts])

    const loadCategories = async () => {
        setLoadingCategories(true)
        try {
            const response = await fetch("/api/categories")
            const result = await response.json()

            if (result.success) {
                console.log("Loaded categories:", result.categories)
                setCategories(result.categories)
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

    const loadProductCounts = async () => {
        try {
            console.log("Loading product counts for categories:", categories)
            const response = await fetch("/api/products")
            const result = await response.json()

            if (result.success) {
                const counts: Record<string, number> = {}

                // Initialize all categories with 0 count
                categories.forEach((category) => {
                    counts[category.id] = 0
                })

                // Count products by category slug and map to category ID
                result.products.forEach((product: any) => {
                    const category = categories.find((cat) => cat.slug === product.category)
                    if (category) {
                        counts[category.id] = (counts[category.id] || 0) + 1
                    }
                })

                console.log("Product counts calculated:", counts)
                setProductCounts(counts)
            }
        } catch (error) {
            console.error("Error loading product counts:", error)
        }
    }

    const filterAndSortCategories = () => {
        let filtered = [...categories]

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(
                (category) =>
                    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    category.slug.toLowerCase().includes(searchQuery.toLowerCase()),
            )
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue: any
            let bValue: any

            switch (sortField) {
                case "name":
                    aValue = a.name.toLowerCase()
                    bValue = b.name.toLowerCase()
                    break
                case "slug":
                    aValue = a.slug.toLowerCase()
                    bValue = b.slug.toLowerCase()
                    break
                case "productCount":
                    aValue = productCounts[a.id] || 0
                    bValue = productCounts[b.id] || 0
                    break
                case "createdAt":
                    aValue = a.createdAt?.seconds || 0
                    bValue = b.createdAt?.seconds || 0
                    break
                default:
                    return 0
            }

            if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
            if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
            return 0
        })

        setFilteredCategories(filtered)
    }

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortDirection("asc")
        }
    }

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return null
        return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
    }

    const formatDate = (timestamp: any) => {
        if (!timestamp) return "Unknown"

        try {
            // Handle Firestore Timestamp
            if (timestamp.seconds) {
                return new Date(timestamp.seconds * 1000).toLocaleDateString()
            }
            // Handle regular Date
            if (timestamp.toDate) {
                return timestamp.toDate().toLocaleDateString()
            }
            // Handle ISO string
            if (typeof timestamp === "string") {
                return new Date(timestamp).toLocaleDateString()
            }
            return "Unknown"
        } catch (error) {
            console.error("Error formatting date:", error, timestamp)
            return "Unknown"
        }
    }

    const handleCreateCategory = async (categoryData: any) => {
        try {
            const response = await fetch("/api/categories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(categoryData),
            })

            const result = await response.json()

            if (result.success) {
                toast({
                    title: "Success!",
                    description: "Category created successfully",
                })
                setShowCreateForm(false)
                loadCategories()
            } else {
                throw new Error(result.error || "Failed to create category")
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create category",
                variant: "destructive",
            })
        }
    }

    const handleUpdateCategory = async (categoryData: any) => {
        if (!editingCategory) return

        try {
            const response = await fetch(`/api/categories/${editingCategory.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(categoryData),
            })

            const result = await response.json()

            if (result.success) {
                toast({
                    title: "Success!",
                    description: "Category updated successfully",
                })
                setEditingCategory(null)
                loadCategories()
            } else {
                throw new Error(result.error || "Failed to update category")
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update category",
                variant: "destructive",
            })
        }
    }

    const handleDeleteCategory = (category: Category) => {
        setDeletingCategory(category)
    }

    const confirmDeleteCategory = async (newCategoryId?: string) => {
        if (!deletingCategory) return

        try {
            if (newCategoryId) {
                // Migrate products to new category
                const response = await fetch(`/api/categories/${deletingCategory.id}/migrate-products`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ newCategoryId }),
                })

                const result = await response.json()

                if (result.success) {
                    toast({
                        title: "Success!",
                        description: result.message,
                    })
                } else {
                    throw new Error(result.error || "Failed to migrate products")
                }
            } else {
                // Direct delete (no products affected)
                const response = await fetch(`/api/categories/${deletingCategory.id}`, {
                    method: "DELETE",
                })

                const result = await response.json()

                if (result.success) {
                    toast({
                        title: "Success!",
                        description: "Category deleted successfully",
                    })
                } else {
                    throw new Error(result.error || "Failed to delete category")
                }
            }

            setDeletingCategory(null)
            loadCategories()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete category",
                variant: "destructive",
            })
        }
    }

    if (loading || loadingCategories) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading categories...</p>
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
                            <h1 className="text-xl font-light tracking-wide text-gray-900">Category Management</h1>
                        </div>
                        <Button onClick={() => setShowCreateForm(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Category
                        </Button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Card */}
                <Card className="mb-8">
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-600">Total Categories</p>
                                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Featured Categories</p>
                                <p className="text-2xl font-bold text-gray-900">{featuredCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Search */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Search Categories</CardTitle>
                        <CardDescription>Find categories by name, description, or slug</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search categories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Categories Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Categories ({filteredCategories.length})</CardTitle>
                        <CardDescription>Manage your product categories</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {filteredCategories.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 mb-4">
                                    {categories.length === 0
                                        ? "No categories found. Create your first category!"
                                        : "No categories match your search."}
                                </p>
                                {categories.length === 0 && (
                                    <Button onClick={() => setShowCreateForm(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Your First Category
                                    </Button>
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
                                                <span>Category</span>
                                                {getSortIcon("name")}
                                            </div>
                                        </th>
                                        <th
                                            className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                                            onClick={() => handleSort("slug")}
                                        >
                                            <div className="flex items-center space-x-1">
                                                <span>Slug</span>
                                                {getSortIcon("slug")}
                                            </div>
                                        </th>
                                        <th
                                            className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                                            onClick={() => handleSort("productCount")}
                                        >
                                            <div className="flex items-center space-x-1">
                                                <span>Products</span>
                                                {getSortIcon("productCount")}
                                            </div>
                                        </th>
                                        <th
                                            className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                                            onClick={() => handleSort("createdAt")}
                                        >
                                            <div className="flex items-center space-x-1">
                                                <span>Created</span>
                                                {getSortIcon("createdAt")}
                                            </div>
                                        </th>
                                        <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {filteredCategories.map((category) => (
                                        <tr key={category.id} className="border-b hover:bg-gray-50">
                                            <td className="py-4 px-4">
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <p className="font-medium text-gray-900">{category.name}</p>
                                                        {category.featured && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Featured
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {category.description && (
                                                        <p className="text-sm text-gray-500 line-clamp-1">{category.description}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {category.slug}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center space-x-2">
                                                    <Package className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm text-gray-900">{productCounts[category.id] || 0} products</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className="text-sm text-gray-500">{formatDate(category.createdAt)}</p>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Button variant="ghost" size="sm" onClick={() => setEditingCategory(category)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteCategory(category)}
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

            {/* Create Category Modal */}
            {showCreateForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold mb-4">Create New Category</h2>
                            <CategoryForm
                                onSubmit={handleCreateCategory}
                                onCancel={() => setShowCreateForm(false)}
                                submitLabel="Create Category"
                                featuredCount={featuredCount}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Category Modal */}
            {editingCategory && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold mb-4">Edit Category</h2>
                            <CategoryForm
                                initialData={editingCategory}
                                onSubmit={handleUpdateCategory}
                                onCancel={() => setEditingCategory(null)}
                                submitLabel="Update Category"
                                featuredCount={featuredCount}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Category Modal */}
            {deletingCategory && (
                <DeleteCategoryModal
                    category={deletingCategory}
                    productCount={productCounts[deletingCategory.id] || 0}
                    availableCategories={categories.filter((c) => c.id !== deletingCategory.id)}
                    onConfirm={confirmDeleteCategory}
                    onCancel={() => setDeletingCategory(null)}
                />
            )}
        </div>
    )
}
