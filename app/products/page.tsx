"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Search, Star, Grid, List } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useAuth } from "@/hooks/use-auth"
import { StoreHeader } from "@/components/store-header"
import { AddToWishlistButton } from "@/components/add-to-wishlist-button"
import { AddToCartButton } from "@/components/add-to-cart-button"

export default function ProductsPage() {
  const { user, isAdmin, logout } = useAuth()
  const searchParams = useSearchParams()
  const category = searchParams.get("category")

  const [products, setProducts] = useState<any[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("name")
  const [priceRange, setPriceRange] = useState([0, 5000])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(category ? [category] : [])
  const [searchQuery, setSearchQuery] = useState("")
  const categories = ["rings", "necklaces", "earrings", "bracelets", "watches"]

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    // Update selected categories when URL category parameter changes
    const urlCategory = searchParams.get("category")
    if (urlCategory) {
      setSelectedCategories([urlCategory])
    } else {
      setSelectedCategories([])
    }
  }, [searchParams])

  useEffect(() => {
    filterProducts()
  }, [products, selectedCategories, priceRange, searchQuery, sortBy])

  const loadProducts = async () => {
    try {
      // Direct Firestore query instead of using firebase-admin
      const { db } = await import("@/lib/firebase")
      const { collection, getDocs } = await import("firebase/firestore")

      if (!db) {
        console.error("Firestore not initialized")
        setLoading(false)
        return
      }

      const productsRef = collection(db, "products")
      const querySnapshot = await getDocs(productsRef)

      const productsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setProducts(productsData)
    } catch (error) {
      console.error("Error loading products:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = [...products]

    // Filter by category
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((product) => selectedCategories.includes(product.category?.toLowerCase()))
    }

    // Filter by price range
    filtered = filtered.filter((product) => product.price >= priceRange[0] && product.price <= priceRange[1])

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
          (product) =>
              product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              product.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return (a.price || 0) - (b.price || 0)
        case "price-high":
          return (b.price || 0) - (a.price || 0)
        case "rating":
          return (b.rating || 0) - (a.rating || 0)
        case "newest":
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt.toDate()).getTime() - new Date(a.createdAt.toDate()).getTime()
          }
          return 0
        default:
          return (a.name || "").localeCompare(b.name || "")
      }
    })

    setFilteredProducts(filtered)
  }

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]))
  }

  return (
      <div className="min-h-screen bg-white pt-16">
        <StoreHeader />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="lg:w-64 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>

                {/* Search */}
                <div className="space-y-2">
                  <Label>Search</Label>
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

                {/* Categories */}
                <div className="space-y-2">
                  <Label>Categories</Label>
                  <div className="space-y-2">
                    {categories.map((cat) => (
                        <div key={cat} className="flex items-center space-x-2">
                          <Checkbox
                              id={cat}
                              checked={selectedCategories.includes(cat)}
                              onCheckedChange={() => toggleCategory(cat)}
                          />
                          <Label htmlFor={cat} className="capitalize">
                            {cat}
                          </Label>
                        </div>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <Label>Price Range</Label>
                  <div className="px-2">
                    <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={5000}
                        min={0}
                        step={50}
                        className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <p className="text-sm text-gray-600">{filteredProducts.length} products found</p>
                </div>

                <div className="flex items-center space-x-4">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name A-Z</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex border rounded-md">
                    <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Products Grid/List */}
              {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
                          <div className="bg-gray-200 h-64 rounded-lg mb-4"></div>
                          <div className="space-y-2">
                            <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                            <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                          </div>
                        </div>
                    ))}
                  </div>
              ) : (
                  <div
                      className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}
                  >
                    {filteredProducts.map((product) => (
                        <Card
                            key={product.id}
                            className={`group cursor-pointer border-0 shadow-sm hover:shadow-lg transition-all duration-300 ${
                                viewMode === "list" ? "flex" : ""
                            }`}
                        >
                          <CardContent className={`p-0 ${viewMode === "list" ? "flex w-full" : ""}`}>
                            <Link href={`/products/${product.id}`} className={viewMode === "list" ? "flex w-full" : ""}>
                              <div className={`relative overflow-hidden ${viewMode === "list" ? "w-48 flex-shrink-0" : ""}`}>
                                <Image
                                    src={
                                        product.featuredImage ||
                                        product.images?.[0] ||
                                        `/placeholder.svg?height=400&width=400&query=jewelry ${product.category || "elegant"}`
                                    }
                                    alt={product.name || "Jewelry"}
                                    width={400}
                                    height={400}
                                    className={`object-cover group-hover:scale-105 transition-transform duration-500 ${
                                        viewMode === "list" ? "w-48 h-48" : "w-full h-64"
                                    }`}
                                />
                                <div
                                    className="absolute top-4 right-4"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                    }}
                                >
                                  <AddToWishlistButton productId={product.id} className="bg-white/80 hover:bg-white" />
                                </div>
                              </div>
                            </Link>

                            <div className={`p-6 space-y-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">{product.category}</p>
                                <h4 className="text-lg font-medium text-gray-900">{product.name}</h4>
                                {viewMode === "list" && product.description && (
                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{product.description}</p>
                                )}
                              </div>

                              <div className="flex items-center space-x-2">
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                      <Star
                                          key={i}
                                          className={`h-3 w-3 ${i < Math.floor(product.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                                      />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-500">({product.reviews || 0})</span>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                            <span className="text-xl font-medium text-gray-900">
                              ${product.price?.toLocaleString() || "0"}
                            </span>
                                  {product.originalPrice && (
                                      <span className="text-sm text-gray-500 line-through">
                                ${product.originalPrice.toLocaleString()}
                              </span>
                                  )}
                                </div>
                                <AddToCartButton
                                    product={product}
                                    variant="textOnly"
                                    disabled={!product.inStock}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                    ))}
                  </div>
              )}

              {!loading && filteredProducts.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No products found matching your criteria.</p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          setSelectedCategories([])
                          setPriceRange([0, 5000])
                          setSearchQuery("")
                        }}
                    >
                      Clear Filters
                    </Button>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
  )
}
