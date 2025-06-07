"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface CategoryFormData {
    name: string
    description: string
    slug: string
}

interface CategoryFormProps {
    initialData?: Partial<CategoryFormData>
    onSubmit: (data: CategoryFormData) => Promise<void>
    onCancel: () => void
    submitLabel: string
}

export function CategoryForm({ initialData, onSubmit, onCancel, submitLabel }: CategoryFormProps) {
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState<CategoryFormData>({
        name: "",
        description: "",
        slug: "",
        ...initialData,
    })

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: "",
                description: "",
                slug: "",
                ...initialData,
            })
        }
    }, [initialData])

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
    }

    const handleNameChange = (name: string) => {
        setFormData((prev) => ({
            ...prev,
            name,
            // Auto-generate slug if it's empty or matches the previous auto-generated slug
            slug: !prev.slug || prev.slug === generateSlug(prev.name) ? generateSlug(name) : prev.slug,
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name.trim()) {
            toast({
                title: "Error",
                description: "Category name is required",
                variant: "destructive",
            })
            return
        }

        if (!formData.slug.trim()) {
            toast({
                title: "Error",
                description: "Category slug is required",
                variant: "destructive",
            })
            return
        }

        // Validate slug format
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
        if (!slugRegex.test(formData.slug)) {
            toast({
                title: "Error",
                description: "Slug must contain only lowercase letters, numbers, and hyphens",
                variant: "destructive",
            })
            return
        }

        setIsSubmitting(true)
        try {
            await onSubmit(formData)
        } catch (error) {
            // Error handling is done in the parent component
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="name">Category Name *</Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Rings"
                    required
                />
            </div>

            <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="rings"
                    required
                />
                <p className="text-xs text-gray-500 mt-1">
                    Used in URLs. Only lowercase letters, numbers, and hyphens allowed.
                </p>
            </div>

            <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Beautiful rings for every occasion"
                    rows={3}
                />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : submitLabel}
                </Button>
            </div>
        </form>
    )
}
