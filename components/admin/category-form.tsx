"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Upload, X, ImageIcon, Crop } from "lucide-react"
import Image from "next/image"
import { ImageCropper } from "./image-cropper"
import { FileBrowser } from "./file-browser"

interface CategoryFormData {
    name: string
    description: string
    slug: string
    featured: boolean
    bannerImage: string
}

interface CategoryFormProps {
    initialData?: Partial<CategoryFormData>
    onSubmit: (data: CategoryFormData) => Promise<void>
    onCancel: () => void
    submitLabel: string
    featuredCount?: number
}

export function CategoryForm({ initialData, onSubmit, onCancel, submitLabel, featuredCount = 0 }: CategoryFormProps) {
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [uploadingImage, setUploadingImage] = useState(false)
    const [showCropper, setShowCropper] = useState(false)
    const [tempImageUrl, setTempImageUrl] = useState("")
    const [formData, setFormData] = useState<CategoryFormData>({
        name: "",
        description: "",
        slug: "",
        featured: false,
        bannerImage: "",
        ...initialData,
    })
    const [showFileBrowser, setShowFileBrowser] = useState(false)

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: "",
                description: "",
                slug: "",
                featured: false,
                bannerImage: "",
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

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast({
                title: "Error",
                description: "Please select an image file",
                variant: "destructive",
            })
            return
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast({
                title: "Error",
                description: "Image size must be less than 10MB",
                variant: "destructive",
            })
            return
        }

        setUploadingImage(true)

        try {
            // First upload the image to the server (same approach as admin/files)
            const formData = new FormData()
            formData.append("file", file)
            formData.append("folder", "categories")

            const uploadResponse = await fetch("/api/files", {
                method: "POST",
                body: formData,
            })

            const result = await uploadResponse.json()

            if (result.success && result.url) {
                // Now use the uploaded image URL for cropping
                setTempImageUrl(result.url)
                setShowCropper(true)
                toast({
                    title: "Success",
                    description: "Image uploaded successfully. Now you can crop it.",
                })
            } else {
                throw new Error(result.error || "Upload failed")
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to upload image",
                variant: "destructive",
            })
        } finally {
            setUploadingImage(false)
        }
    }

    const handleCropComplete = async (croppedImageUrl: string) => {
        setShowCropper(false)

        try {
            // The cropped image URL is already uploaded and ready to use
            setFormData((prev) => ({
                ...prev,
                bannerImage: croppedImageUrl,
            }))

            toast({
                title: "Success",
                description: "Banner image cropped and saved successfully",
            })
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to process cropped image",
                variant: "destructive",
            })
        } finally {
            // Clean up temporary URL if it was a blob URL
            if (tempImageUrl && tempImageUrl.startsWith("blob:")) {
                URL.revokeObjectURL(tempImageUrl)
            }
            setTempImageUrl("")
        }
    }

    const handleCropCancel = () => {
        setShowCropper(false)
        // Clean up temporary URL if it was a blob URL
        if (tempImageUrl && tempImageUrl.startsWith("blob:")) {
            URL.revokeObjectURL(tempImageUrl)
        }
        setTempImageUrl("")
    }

    const handleFileSelect = (fileUrl: string, fileName: string) => {
        setTempImageUrl(fileUrl)
        setShowFileBrowser(false)
        setShowCropper(true)
    }

    const handleRemoveImage = () => {
        setFormData((prev) => ({
            ...prev,
            bannerImage: "",
        }))
    }

    const handleFeaturedChange = (checked: boolean) => {
        // Check if we're trying to feature more than 4 categories
        if (checked && featuredCount >= 4 && !initialData?.featured) {
            toast({
                title: "Limit Reached",
                description: "You can only feature up to 4 categories",
                variant: "destructive",
            })
            return
        }

        setFormData((prev) => ({
            ...prev,
            featured: checked,
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
        <>
            <form onSubmit={handleSubmit} className="space-y-6">
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

                {/* Featured Checkbox */}
                <div className="flex items-center space-x-2">
                    <Checkbox id="featured" checked={formData.featured} onCheckedChange={handleFeaturedChange} />
                    <Label htmlFor="featured" className="text-sm font-medium">
                        Featured Category
                    </Label>
                    <span className="text-xs text-gray-500">({featuredCount}/4 featured)</span>
                </div>

                {/* Banner Image Upload */}
                <div>
                    <Label>Banner Image</Label>
                    <div className="mt-2">
                        {formData.bannerImage ? (
                            <div className="relative">
                                <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                                    <Image
                                        src={formData.bannerImage || "/placeholder.svg"}
                                        alt="Category banner"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="absolute top-2 right-2 space-x-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => document.getElementById("banner-upload")?.click()}
                                    >
                                        <Crop className="h-4 w-4 mr-2" />
                                        Replace
                                    </Button>
                                    <Button type="button" variant="destructive" size="sm" onClick={handleRemoveImage}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                                <div className="text-center">
                                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="mt-4">
                                        <Label htmlFor="banner-upload" className="cursor-pointer">
                                            <span className="mt-2 block text-sm font-medium text-gray-900">Upload banner image</span>
                                            <span className="mt-1 block text-xs text-gray-500">PNG, JPG, GIF up to 10MB</span>
                                        </Label>
                                        <Input
                                            id="banner-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageSelect}
                                            className="hidden"
                                            disabled={uploadingImage}
                                        />
                                    </div>
                                    <div className="mt-4 space-x-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={uploadingImage}
                                            onClick={() => document.getElementById("banner-upload")?.click()}
                                        >
                                            {uploadingImage ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                                                    Uploading...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="h-4 w-4 mr-2" />
                                                    Upload New
                                                </>
                                            )}
                                        </Button>
                                        <Button type="button" variant="outline" onClick={() => setShowFileBrowser(true)}>
                                            <ImageIcon className="h-4 w-4 mr-2" />
                                            Browse Files
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Hidden file input for replace functionality */}
                        <Input
                            id="banner-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                            disabled={uploadingImage}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Recommended size: 475 × 925px. You'll be able to crop and position the image after upload.
                    </p>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting || uploadingImage}>
                        {isSubmitting ? "Saving..." : submitLabel}
                    </Button>
                </div>
            </form>

            {/* Image Cropper Modal */}
            <ImageCropper
                isOpen={showCropper}
                onClose={handleCropCancel}
                onCrop={handleCropComplete}
                imageUrl={tempImageUrl}
                aspectRatio={475 / 925}
                suggestedWidth={475}
                suggestedHeight={925}
            />

            {/* File Browser Modal */}
            <FileBrowser
                isOpen={showFileBrowser}
                onClose={() => setShowFileBrowser(false)}
                onSelect={handleFileSelect}
                title="Select Banner Image"
            />
        </>
    )
}
