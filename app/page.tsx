"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { StoreHeader } from "@/components/store-header"
import { AddToCartButton } from "@/components/add-to-cart-button"

export default function HomePage() {
  const { user, isAdmin } = useAuth()
  const [products, setProducts] = useState<any[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

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

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]))
  }

  return (
      <div className="min-h-screen bg-white">
        {/* Minimal Header */}
        <StoreHeader />

        {/* Hero - Large Image Focus */}
        <section className="relative h-screen">
          <Image
              src="/placeholder.svg?height=1080&width=1920"
              alt="Luxury jewelry collection"
              fill
              className="object-cover"
              priority
          />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white space-y-6">
              <h1 className="text-6xl md:text-8xl font-thin tracking-widest">LUMIÈRE</h1>
              <p className="text-lg tracking-wide opacity-90">Timeless Elegance</p>
              <Link href="/products">
                <Button className="bg-white text-black hover:bg-gray-100 px-8 py-3 text-sm tracking-wide">
                  DISCOVER
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Category Grid - Image Heavy */}
        <section className="py-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 h-screen">
            <Link href="/products?category=rings" className="group relative overflow-hidden">
              <Image
                  src="/placeholder.svg?height=600&width=400"
                  alt="Rings"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
              <div className="absolute bottom-8 left-8">
                <h3 className="text-white text-2xl font-light tracking-wide">RINGS</h3>
              </div>
            </Link>

            <Link href="/products?category=necklaces" className="group relative overflow-hidden">
              <Image
                  src="/placeholder.svg?height=600&width=400"
                  alt="Necklaces"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
              <div className="absolute bottom-8 left-8">
                <h3 className="text-white text-2xl font-light tracking-wide">NECKLACES</h3>
              </div>
            </Link>

            <Link href="/products?category=earrings" className="group relative overflow-hidden">
              <Image
                  src="/placeholder.svg?height=600&width=400"
                  alt="Earrings"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
              <div className="absolute bottom-8 left-8">
                <h3 className="text-white text-2xl font-light tracking-wide">EARRINGS</h3>
              </div>
            </Link>

            <Link href="/products?category=bracelets" className="group relative overflow-hidden">
              <Image
                  src="/placeholder.svg?height=600&width=400"
                  alt="Bracelets"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
              <div className="absolute bottom-8 left-8">
                <h3 className="text-white text-2xl font-light tracking-wide">BRACELETS</h3>
              </div>
            </Link>
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
                                  <Button
                                      variant="secondary"
                                      size="icon"
                                      className="bg-white/90 hover:bg-white shadow-lg"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        toggleFavorite(product.id)
                                      }}
                                  >
                                    <Heart
                                        className={`h-4 w-4 ${favorites.includes(product.id) ? "fill-red-500 text-red-500" : "text-gray-600"}`}
                                    />
                                  </Button>
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
                            </Link>

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
              <h4 className="text-2xl font-thin tracking-widest">LUMIÈRE</h4>
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
                <p className="text-sm text-gray-400 tracking-wide">© 2024 LUMIÈRE. ALL RIGHTS RESERVED.</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
  )
}
