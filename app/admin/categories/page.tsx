"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Edit, Trash2, ArrowLeft, Package } from "lucide-react"

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
}

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

    useEffect(() => {
        if (!loading && (!user || !isAdmin)) {
            router.push("/auth")
        }
    }, [user, isAdmin, loading, router])

    useEffect(() => {
        if (user && isAdmin) {
            loadCategories()
            loadProductCounts()
        }
    }, [user, isAdmin])

    useEffect(() => {
        filterCategories()
    }, [categories, searchQuery])

    const loadCategories = async () => {
        setLoadingCategories(true)
        try {
            const response = await fetch("/api/categories")
            const result = await response.json()

            if (result.success) {
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
            const response = await fetch("/api/products")
            const result = await response.json()

            if (result.success) {
                const counts: Record<string, number> = {}

                // Count products by category slug, but map to category document ID
                const categorySlugToId: Record<string, string> = {}
                categories.forEach((category) => {
                    categorySlugToId[category.slug] = category.id
                })

                result.products.forEach((product: any) => {
                    const categoryId = categorySlugToId[product.category]
                    if (categoryId) {
                        counts[categoryId] = (counts[categoryId] || 0) + 1
                    }
                })

                setProductCounts(counts)
                console.log("Product counts by category:", counts)
            }
        } catch (error) {
            console.error("Error loading product counts:", error)
        }
    }

    const filterCategories = () => {
        let filtered = [...categories]

        if (searchQuery) {
            filtered = filtered.filter(
                (category) =>
                    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    category.slug.toLowerCase().includes(searchQuery.toLowerCase()),
            )
        }

        setFilteredCategories(filtered)
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
                loadProductCounts()
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
            loadProductCounts()
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
                                        <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900">Slug</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900">Products</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900">Created</th>
                                        <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {filteredCategories.map((category) => (
                                        <tr key={category.id} className="border-b hover:bg-gray-50">
                                            <td className="py-4 px-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">{category.name}</p>
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
                                                <p className="text-sm text-gray-500">
                                                    {category.createdAt?.toDate?.()?.toLocaleDateString() || "Unknown"}
                                                </p>
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
