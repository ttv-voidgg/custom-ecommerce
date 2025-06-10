"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { StoreHeader } from "@/components/store-header"
import { AddToCartButton } from "@/components/add-to-cart-button"
import { AddToWishlistButton } from "@/components/add-to-wishlist-button"

interface StoreSettings {
  name: string
  bannerImage: string
  shortTagline: string
  buttonText: string
}

export default function HomePage() {
  const { user, isAdmin } = useAuth()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<any[]>([])
  const [featuredCategories, setFeaturedCategories] = useState<any[]>([])
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    name: "LUMIÈRE",
    bannerImage: "",
    shortTagline: "Timeless Elegance",
    buttonText: "DISCOVER",
  })

  useEffect(() => {
    loadProducts()
    loadCategories()
    loadStoreSettings()
  }, [])

  const loadStoreSettings = async () => {
    try {
      const { db } = await import("@/lib/firebase")
      const { doc, getDoc } = await import("firebase/firestore")

      if (!db) {
        console.error("Firestore not initialized")
        return
      }

      const storeDoc = await getDoc(doc(db, "settings", "store"))
      if (storeDoc.exists()) {
        const data = storeDoc.data()
        setStoreSettings({
          name: data.name || "LUMIÈRE",
          bannerImage: data.bannerImage || "",
          shortTagline: data.shortTagline || "Timeless Elegance",
          buttonText: data.buttonText || "DISCOVER",
        })
      }
    } catch (error) {
      console.error("Error loading store settings:", error)
    }
  }

  const loadProducts = async () => {
    try {
      // Dynamically import Firebase to avoid SSR issues
      const { db } = await import("@/lib/firebase")
      const { collection, getDocs, limit, query } = await import("firebase/firestore")

      if (!db) {
        console.error("Firestore not initialized")
        setLoading(false)
        return
      }

      const productsRef = collection(db, "products")
      const q = query(productsRef, limit(8))
      const querySnapshot = await getDocs(q)

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

  const loadCategories = async () => {
    try {
      const { db } = await import("@/lib/firebase")
      const { collection, getDocs } = await import("firebase/firestore")

      if (!db) {
        console.error("Firestore not initialized")
        return
      }

      // Load all categories
      const categoriesRef = collection(db, "categories")
      const querySnapshot = await getDocs(categoriesRef)
      const categoriesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setCategories(categoriesData)

      // Separate featured and non-featured categories
      const featured = categoriesData.filter((cat) => cat.featured)
      const nonFeatured = categoriesData.filter((cat) => !cat.featured)

      // Always aim for exactly 4 categories
      const maxCategories = 4
      let displayCategories = []

      if (featured.length >= maxCategories) {
        // If we have 4 or more featured categories, just take the first 4
        displayCategories = featured.slice(0, maxCategories)
      } else {
        // Start with all featured categories
        displayCategories = [...featured]

        // Fill remaining slots with non-featured categories
        const remainingSlots = maxCategories - featured.length
        const shuffledNonFeatured = [...nonFeatured].sort(() => 0.5 - Math.random())
        displayCategories = [...displayCategories, ...shuffledNonFeatured.slice(0, remainingSlots)]
      }

      // Ensure we have exactly 4 categories (or all available if less than 4 total)
      const finalCategories = displayCategories.slice(0, Math.min(maxCategories, categoriesData.length))

      setFeaturedCategories(finalCategories)
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  return (
      <div className="min-h-screen bg-white">
        {/* Minimal Header */}
        <StoreHeader />

        {/* Hero - Dynamic Content */}
        <section className="relative h-screen">
          <Image
              src={
                  storeSettings.bannerImage ||
                  "/placeholder.svg?height=1080&width=1920&query=luxury jewelry hero banner" ||
                  "/placeholder.svg"
              }
              alt="Luxury jewelry collection"
              fill
              className="object-cover"
              priority
          />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white space-y-6">
              <h1 className="text-6xl md:text-8xl font-thin tracking-widest">{storeSettings.name.toUpperCase()}</h1>
              <p className="text-lg tracking-wide opacity-90">{storeSettings.shortTagline}</p>
              <Link href="/products">
                <Button className="bg-white text-black hover:bg-gray-100 px-8 py-3 text-sm tracking-wide">
                  {storeSettings.buttonText.toUpperCase()}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Category Grid - Dynamic from Database */}
        <section className="py-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 h-screen">
            {featuredCategories.map((category, index) => (
                <Link
                    key={category.id}
                    href={`/products?category=${category.slug}`}
                    className="group relative overflow-hidden"
                >
                  <Image
                      src={
                          category.bannerImage ||
                          `/placeholder.svg?height=600&width=400&query=${category.name || "/placeholder.svg"} jewelry category`
                      }
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute bottom-8 left-8">
                    <h3 className="text-white text-2xl font-light tracking-wide">{category.name.toUpperCase()}</h3>
                  </div>
                </Link>
            ))}
          </div>
        </section>

        {/* Featured Products - Masonry Style */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-thin tracking-widest text-gray-900 mb-8">FEATURED</h2>
            </div>

            {loading ? (
                <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                  {[...Array(8)].map((_, i) => (
                      <div key={i} className="break-inside-avoid">
                        <div className="bg-white rounded-lg overflow-hidden animate-pulse">
                          <div className="bg-gray-200 h-80 w-full"></div>
                          <div className="p-4 space-y-2">
                            <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                            <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                  ))}
                </div>
            ) : (
                <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                  {products.map((product, index) => (
                      <div key={product.id} className="break-inside-avoid">
                        <Card className="group cursor-pointer border-0 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
                          <CardContent className="p-0">
                            <Link href={`/products/${product.id}`}>
                              <div className="relative overflow-hidden">
                                <Image
                                    src={
                                        product.featuredImage ||
                                        product.images?.[0] ||
                                        `/placeholder.svg?height=${400 + (index % 3) * 100 || "/placeholder.svg"}&width=400&query=luxury jewelry ${product.category || "elegant"}`
                                    }
                                    alt={product.name || "Jewelry"}
                                    width={400}
                                    height={400 + (index % 3) * 100}
                                    className="w-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                                {/* Floating Action Buttons */}
                                <div className="absolute top-4 right-4 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <div
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                      }}
                                  >
                                    <AddToWishlistButton
                                        productId={product.id}
                                        className="bg-white/90 hover:bg-white shadow-lg"
                                    />
                                  </div>
                                  <div
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                      }}
                                  >
                                    <AddToCartButton product={product} variant="icon" />
                                  </div>
                                </div>
                              </div>

                              {/* Minimal Product Info */}
                              <div className="p-6 space-y-3">
                                <div className="text-center">
                                  <h4 className="text-lg font-light text-gray-900 tracking-wide">
                                    {product.name || "Jewelry Piece"}
                                  </h4>
                                  <p className="text-xl font-light text-gray-900 mt-2">
                                    ${product.price?.toLocaleString() || "0"}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          </CardContent>
                        </Card>
                      </div>
                  ))}
                </div>
            )}

            <div className="text-center mt-16">
              <Link href="/products">
                <Button
                    variant="outline"
                    className="border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white px-12 py-3 tracking-wide"
                >
                  VIEW ALL
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Newsletter - Minimal */}
        <section className="py-20 bg-white">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-3xl font-thin tracking-widest text-gray-900 mb-8">STAY CONNECTED</h3>
            <div className="flex max-w-md mx-auto">
              <Input
                  placeholder="Email address"
                  className="flex-1 border-0 border-b border-gray-300 rounded-none focus:border-gray-900 bg-transparent"
              />
              <Button className="bg-gray-900 hover:bg-gray-800 text-white px-8 rounded-none">JOIN</Button>
            </div>
          </div>
        </section>

        {/* Minimal Footer */}
        <footer className="bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center space-y-8">
              <h4 className="text-2xl font-thin tracking-widest">{storeSettings.name.toUpperCase()}</h4>
              <div className="flex justify-center space-x-12 text-sm tracking-wide">
                <Link href="/contact" className="hover:text-gray-300 transition-colors">
                  CONTACT
                </Link>
                <Link href="/care" className="hover:text-gray-300 transition-colors">
                  CARE
                </Link>
                <Link href="/returns" className="hover:text-gray-300 transition-colors">
                  RETURNS
                </Link>
                <Link href="/size-guide" className="hover:text-gray-300 transition-colors">
                  SIZE GUIDE
                </Link>
              </div>
              <div className="border-t border-gray-800 pt-8">
                <p className="text-sm text-gray-400 tracking-wide">
                  © 2024 {storeSettings.name.toUpperCase()}. ALL RIGHTS RESERVED.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
  )
}
