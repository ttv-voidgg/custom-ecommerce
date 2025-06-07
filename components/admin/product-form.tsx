"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Plus, X, Loader2, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { uploadWithProgress } from "@/lib/upload-with-progress"

interface ProductFormData {
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
  specifications: {
    material?: string
    gemstone?: string
    caratWeight?: string
    clarity?: string
    color?: string
    cut?: string
    length?: string
    width?: string
    setting?: string
    origin?: string
    pearlSize?: string
    clasp?: string
    finish?: string
    comfort?: string
    style?: string
    dimensions?: string
    totalCaratWeight?: string
  }
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData>
  onSubmit: (data: ProductFormData) => Promise<void>
  isLoading: boolean
  submitLabel: string
}

const categories = []
export function ProductForm({ initialData, onSubmit, isLoading, submitLabel }: ProductFormProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [categories, setCategories] = useState<any[]>([])

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: 0,
    originalPrice: undefined,
    category: "",
    images: [],
    featuredImage: undefined,
    inStock: true,
    stockQuantity: 0,
    rating: 0,
    reviews: 0,
    featured: false,
    tags: [],
    specifications: {},
    ...initialData,
  })

  const [newTag, setNewTag] = useState("")

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      const result = await response.json()
      if (result.success) {
        setCategories(result.categories)
      }
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  useEffect(() => {
    if (initialData) {
      console.log("Setting initial form data:", initialData)
      const updatedData = {
        name: "",
        description: "",
        price: 0,
        originalPrice: undefined,
        category: "",
        images: [],
        featuredImage: undefined,
        inStock: true,
        stockQuantity: 0,
        rating: 0,
        reviews: 0,
        featured: false,
        tags: [],
        specifications: {},
        ...initialData,
      }

      // Set featured image to first image if not already set
      if (updatedData.images && updatedData.images.length > 0 && !updatedData.featuredImage) {
        updatedData.featuredImage = updatedData.images[0]
      }

      setFormData(updatedData)
    }
  }, [initialData])

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSpecificationChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [field]: value,
      },
    }))
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadProgress(0)

    try {
      // Try SFTP upload first
      try {
        const result = await uploadWithProgress("/api/files", file, "/products", (percentage) => {
          setUploadProgress(percentage)
        })

        if (result.success && result.url) {
          setFormData((prev) => {
            const newImages = [...prev.images, result.url]
            return {
              ...prev,
              images: newImages,
              // Set as featured image if it's the first image
              featuredImage: prev.images.length === 0 ? result.url : prev.featuredImage,
            }
          })
          toast({
            title: "Image uploaded!",
            description: "Product image uploaded successfully",
          })
        }
      } catch (sftpError) {
        console.error("SFTP upload failed, trying local fallback:", sftpError)
        // Try local fallback
        const fallbackResult = await uploadWithProgress("/api/files/local", file, "/products", (percentage) => {
          setUploadProgress(percentage)
        })

        if (fallbackResult.success && fallbackResult.url) {
          setFormData((prev) => {
            const newImages = [...prev.images, fallbackResult.url]
            return {
              ...prev,
              images: newImages,
              // Set as featured image if it's the first image
              featuredImage: prev.images.length === 0 ? fallbackResult.url : prev.featuredImage,
            }
          })
          toast({
            title: "Image uploaded locally",
            description: "Image stored locally as SFTP fallback",
          })
        }
      }
    } catch (error) {
      console.error("Image upload error:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      // Reset input
      e.target.value = ""
    }
  }

  const handleRemoveImage = (indexToRemove: number) => {
    const imageToRemove = formData.images[indexToRemove]
    setFormData((prev) => {
      const newImages = prev.images.filter((_, index) => index !== indexToRemove)
      return {
        ...prev,
        images: newImages,
        // If removing the featured image, set the first remaining image as featured
        featuredImage:
            prev.featuredImage === imageToRemove ? (newImages.length > 0 ? newImages[0] : undefined) : prev.featuredImage,
      }
    })
  }

  const handleSetFeaturedImage = (imageUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      featuredImage: imageUrl,
    }))
    toast({
      title: "Featured image updated",
      description: "This image will be displayed as the main product image",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Product name is required",
        variant: "destructive",
      })
      return
    }

    if (!formData.description.trim()) {
      toast({
        title: "Error",
        description: "Product description is required",
        variant: "destructive",
      })
      return
    }

    if (!formData.category) {
      toast({
        title: "Error",
        description: "Product categories is required",
        variant: "destructive",
      })
      return
    }

    if (formData.price <= 0) {
      toast({
        title: "Error",
        description: "Product price must be greater than 0",
        variant: "destructive",
      })
      return
    }

    await onSubmit(formData)
  }

  return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the basic details of your product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Diamond Solitaire Ring"
                    required
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Elegant 1-carat diamond solitaire ring in 18k white gold setting"
                  rows={3}
                  required
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Inventory */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Inventory</CardTitle>
            <CardDescription>Set pricing and manage inventory</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", Number.parseFloat(e.target.value) || 0)}
                    placeholder="2499.00"
                    required
                />
              </div>

              <div>
                <Label htmlFor="originalPrice">Original Price ($)</Label>
                <Input
                    id="originalPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.originalPrice || ""}
                    onChange={(e) => handleInputChange("originalPrice", Number.parseFloat(e.target.value) || undefined)}
                    placeholder="2999.00"
                />
              </div>

              <div>
                <Label htmlFor="stockQuantity">Stock Quantity</Label>
                <Input
                    id="stockQuantity"
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => handleInputChange("stockQuantity", Number.parseInt(e.target.value) || 0)}
                    placeholder="5"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                  id="inStock"
                  checked={formData.inStock}
                  onCheckedChange={(checked) => handleInputChange("inStock", checked)}
              />
              <Label htmlFor="inStock">In Stock</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => handleInputChange("featured", checked)}
              />
              <Label htmlFor="featured">Featured Product</Label>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
            <CardDescription>
              Upload high-quality images of your product. Click the star to set as featured image.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="images">Upload Images</Label>
              <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
              />

              {uploading && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm text-blue-600">
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Uploading image...
                      </div>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
              )}
            </div>

            {formData.images && formData.images.length > 0 && (
                <div className="space-y-4">
                  {/* Featured Image Preview */}
                  {formData.featuredImage && (
                      <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                        <Label className="text-sm font-medium text-blue-900 mb-2 block">Featured Image</Label>
                        <div className="flex items-center space-x-3">
                          <Image
                              src={formData.featuredImage || "/placeholder.svg"}
                              alt="Featured image"
                              width={80}
                              height={80}
                              className="rounded-lg object-cover border-2 border-blue-300"
                          />
                          <div className="text-sm text-blue-700">
                            This image will be displayed as the main product image in listings and previews.
                          </div>
                        </div>
                      </div>
                  )}

                  {/* All Images Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <Image
                              src={image || "/placeholder.svg"}
                              alt={`Product image ${index + 1}`}
                              width={200}
                              height={200}
                              className={`w-full h-32 object-cover rounded-lg border-2 ${
                                  formData.featuredImage === image ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"
                              }`}
                          />

                          {/* Featured Image Star */}
                          <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className={`absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                                  formData.featuredImage === image
                                      ? "opacity-100 text-yellow-500"
                                      : "text-gray-400 hover:text-yellow-500"
                              }`}
                              onClick={() => handleSetFeaturedImage(image)}
                              title={formData.featuredImage === image ? "Featured image" : "Set as featured image"}
                          >
                            <Star className={`h-4 w-4 ${formData.featuredImage === image ? "fill-current" : ""}`} />
                          </Button>

                          {/* Remove Image Button */}
                          <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>

                          {/* Image Index */}
                          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                            {index + 1}
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
            )}
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            <CardDescription>Add tags to help customers find your product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" onClick={handleAddTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                      <div key={tag} className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
                        <span>{tag}</span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-2 h-4 w-4 p-0"
                            onClick={() => handleRemoveTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                  ))}
                </div>
            )}
          </CardContent>
        </Card>

        {/* Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
            <CardDescription>Add detailed specifications for your jewelry</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="material">Material</Label>
                <Input
                    id="material"
                    value={formData.specifications?.material || ""}
                    onChange={(e) => handleSpecificationChange("material", e.target.value)}
                    placeholder="18k White Gold"
                />
              </div>

              <div>
                <Label htmlFor="gemstone">Gemstone</Label>
                <Input
                    id="gemstone"
                    value={formData.specifications?.gemstone || ""}
                    onChange={(e) => handleSpecificationChange("gemstone", e.target.value)}
                    placeholder="Diamond"
                />
              </div>

              <div>
                <Label htmlFor="caratWeight">Carat Weight</Label>
                <Input
                    id="caratWeight"
                    value={formData.specifications?.caratWeight || ""}
                    onChange={(e) => handleSpecificationChange("caratWeight", e.target.value)}
                    placeholder="1.0ct"
                />
              </div>

              <div>
                <Label htmlFor="clarity">Clarity</Label>
                <Input
                    id="clarity"
                    value={formData.specifications?.clarity || ""}
                    onChange={(e) => handleSpecificationChange("clarity", e.target.value)}
                    placeholder="VS1"
                />
              </div>

              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                    id="color"
                    value={formData.specifications?.color || ""}
                    onChange={(e) => handleSpecificationChange("color", e.target.value)}
                    placeholder="F"
                />
              </div>

              <div>
                <Label htmlFor="cut">Cut</Label>
                <Input
                    id="cut"
                    value={formData.specifications?.cut || ""}
                    onChange={(e) => handleSpecificationChange("cut", e.target.value)}
                    placeholder="Round Brilliant"
                />
              </div>

              <div>
                <Label htmlFor="length">Length</Label>
                <Input
                    id="length"
                    value={formData.specifications?.length || ""}
                    onChange={(e) => handleSpecificationChange("length", e.target.value)}
                    placeholder="18 inches"
                />
              </div>

              <div>
                <Label htmlFor="setting">Setting</Label>
                <Input
                    id="setting"
                    value={formData.specifications?.setting || ""}
                    onChange={(e) => handleSpecificationChange("setting", e.target.value)}
                    placeholder="Prong"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rating & Reviews */}
        <Card>
          <CardHeader>
            <CardTitle>Rating & Reviews</CardTitle>
            <CardDescription>Set initial rating and review count</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rating">Rating (0-5)</Label>
                <Input
                    id="rating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) => handleInputChange("rating", Number.parseFloat(e.target.value) || 0)}
                    placeholder="4.9"
                />
              </div>

              <div>
                <Label htmlFor="reviews">Number of Reviews</Label>
                <Input
                    id="reviews"
                    type="number"
                    min="0"
                    value={formData.reviews}
                    onChange={(e) => handleInputChange("reviews", Number.parseInt(e.target.value) || 0)}
                    placeholder="127"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading || uploading} size="lg">
            {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
            ) : (
                submitLabel
            )}
          </Button>
        </div>
      </form>
  )
}
