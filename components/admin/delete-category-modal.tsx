"use client"

import { useState } from "react"
import { AlertTriangle, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CategoryForm } from "./category-form"
import { useToast } from "@/hooks/use-toast"

interface Category {
    id: string
    name: string
    description: string
    slug: string
}

interface DeleteCategoryModalProps {
    category: Category
    productCount: number
    availableCategories: Category[]
    onConfirm: (newCategoryId?: string) => Promise<void>
    onCancel: () => void
}

export function DeleteCategoryModal({
                                        category,
                                        productCount,
                                        availableCategories,
                                        onConfirm,
                                        onCancel,
                                    }: DeleteCategoryModalProps) {
    const { toast } = useToast()
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleConfirmDelete = async () => {
        if (productCount > 0 && !selectedCategoryId) {
            toast({
                title: "Error",
                description: "Please select a categories for the affected products",
                variant: "destructive",
            })
            return
        }

        setIsDeleting(true)
        try {
            await onConfirm(productCount > 0 ? selectedCategoryId : undefined)
        } catch (error) {
            // Error handling is done in parent component
        } finally {
            setIsDeleting(false)
        }
    }

    const handleCreateNewCategory = async (categoryData: any) => {
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
                    description: "New categories created successfully",
                })
                setSelectedCategoryId(result.category.id)
                setShowCreateForm(false)
                // Add the new categories to available categories
                availableCategories.push(result.category)
            } else {
                throw new Error(result.error || "Failed to create categories")
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create categories",
                variant: "destructive",
            })
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {!showCreateForm ? (
                        <>
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="flex-shrink-0">
                                    <AlertTriangle className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Delete Category</h2>
                                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <p className="text-sm text-gray-700 mb-2">
                                    You are about to delete the category <strong>"{category.name}"</strong>.
                                </p>

                                {productCount > 0 ? (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                        <div className="flex items-start space-x-2">
                                            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-yellow-800">
                                                    {productCount} product{productCount > 1 ? "s" : ""} will be affected
                                                </p>
                                                <p className="text-sm text-yellow-700 mt-1">
                                                    Please select a new category for these products before deleting.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                        <p className="text-sm text-green-800">
                                            No products are using this category. It can be safely deleted.
                                        </p>
                                    </div>
                                )}

                                {productCount > 0 && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Move products to category:</label>
                                            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableCategories.map((cat) => (
                                                        <SelectItem key={cat.id} value={cat.id}>
                                                            {cat.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="text-center">
                                            <p className="text-sm text-gray-600 mb-2">Don't see the category you need?</p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowCreateForm(true)}
                                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Create New Category
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end space-x-2">
                                <Button type="button" variant="outline" onClick={onCancel} disabled={isDeleting}>
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={handleConfirmDelete}
                                    disabled={isDeleting || (productCount > 0 && !selectedCategoryId)}
                                >
                                    {isDeleting ? "Deleting..." : "Delete Category"}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Create New Category</h2>
                                <p className="text-sm text-gray-600">Create a new category to move the affected products to.</p>
                            </div>

                            <CategoryForm
                                onSubmit={handleCreateNewCategory}
                                onCancel={() => setShowCreateForm(false)}
                                submitLabel="Create Category"
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
