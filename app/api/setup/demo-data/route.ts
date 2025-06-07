import { NextResponse } from "next/server"
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

const demoProducts = [
  {
    name: "Diamond Solitaire Ring",
    description:
        "Elegant 1-carat diamond solitaire ring in 18k white gold setting. Perfect for engagements and special occasions.",
    price: 2499,
    originalPrice: 2999,
    category: "rings",
    images: ["/placeholder.svg?height=600&width=600"],
    inStock: true,
    stockQuantity: 5,
    rating: 4.9,
    reviews: 127,
    featured: true,
    tags: ["diamond", "engagement", "luxury", "white gold"],
    specifications: {
      material: "18k White Gold",
      gemstone: "Diamond",
      caratWeight: "1.0ct",
      clarity: "VS1",
      color: "F",
      cut: "Round Brilliant",
    },
  },
  {
    name: "Pearl Drop Earrings",
    description: "Classic freshwater pearl drop earrings with gold accents. Timeless elegance for any occasion.",
    price: 899,
    category: "earrings",
    images: ["/placeholder.svg?height=600&width=600"],
    inStock: true,
    stockQuantity: 12,
    rating: 4.8,
    reviews: 89,
    featured: true,
    tags: ["pearl", "classic", "elegant", "gold"],
    specifications: {
      material: "14k Yellow Gold",
      gemstone: "Freshwater Pearl",
      pearlSize: "8-9mm",
      length: "1.5 inches",
    },
  },
  {
    name: "Gold Chain Necklace",
    description:
        "Delicate 18k gold chain necklace, perfect for layering or wearing alone. Minimalist luxury at its finest.",
    price: 1299,
    category: "necklaces",
    images: ["/placeholder.svg?height=600&width=600"],
    inStock: true,
    stockQuantity: 8,
    rating: 4.7,
    reviews: 156,
    featured: true,
    tags: ["gold", "chain", "layering", "minimalist"],
    specifications: {
      material: "18k Yellow Gold",
      length: "18 inches",
      width: "1.2mm",
      clasp: "Spring Ring",
    },
  },
  {
    name: "Tennis Bracelet",
    description: "Stunning diamond tennis bracelet with brilliant cut diamonds. A classic piece for special occasions.",
    price: 1899,
    originalPrice: 2199,
    category: "bracelets",
    images: ["/placeholder.svg?height=600&width=600"],
    inStock: true,
    stockQuantity: 3,
    rating: 4.9,
    reviews: 203,
    featured: true,
    tags: ["diamond", "tennis", "luxury", "brilliant"],
    specifications: {
      material: "14k White Gold",
      gemstone: "Diamond",
      totalCaratWeight: "3.0ct",
      length: "7 inches",
      setting: "Prong",
    },
  },
  {
    name: "Emerald Stud Earrings",
    description: "Vibrant emerald stud earrings in platinum setting. Colombian emeralds with exceptional clarity.",
    price: 1599,
    category: "earrings",
    images: ["/placeholder.svg?height=600&width=600"],
    inStock: true,
    stockQuantity: 6,
    rating: 4.8,
    reviews: 94,
    featured: false,
    tags: ["emerald", "stud", "platinum", "vibrant"],
    specifications: {
      material: "Platinum",
      gemstone: "Emerald",
      caratWeight: "1.5ct each",
      origin: "Colombian",
      setting: "Four Prong",
    },
  },
  {
    name: "Rose Gold Band",
    description: "Simple yet elegant rose gold wedding band. Comfort fit design with polished finish.",
    price: 799,
    category: "rings",
    images: ["/placeholder.svg?height=600&width=600"],
    inStock: true,
    stockQuantity: 15,
    rating: 4.6,
    reviews: 78,
    featured: false,
    tags: ["rose gold", "wedding", "band", "simple"],
    specifications: {
      material: "14k Rose Gold",
      width: "3mm",
      finish: "Polished",
      comfort: "Comfort Fit",
    },
  },
  {
    name: "Sapphire Pendant",
    description: "Royal blue sapphire pendant with diamond halo. Comes with matching 18k white gold chain.",
    price: 2199,
    category: "necklaces",
    images: ["/placeholder.svg?height=600&width=600"],
    inStock: true,
    stockQuantity: 4,
    rating: 4.9,
    reviews: 112,
    featured: true,
    tags: ["sapphire", "pendant", "diamond", "halo"],
    specifications: {
      material: "18k White Gold",
      centerStone: "Blue Sapphire",
      caratWeight: "2.0ct",
      halo: "Diamond",
      chainLength: "16-18 inches",
    },
  },
  {
    name: "Vintage Art Deco Brooch",
    description: "Art Deco inspired vintage brooch with intricate geometric details and mixed gemstones.",
    price: 1399,
    category: "brooches",
    images: ["/placeholder.svg?height=600&width=600"],
    inStock: true,
    stockQuantity: 2,
    rating: 4.7,
    reviews: 45,
    featured: false,
    tags: ["vintage", "art deco", "brooch", "intricate"],
    specifications: {
      material: "14k Yellow Gold",
      style: "Art Deco",
      dimensions: "2 x 1.5 inches",
      gemstones: "Mixed",
    },
  },
]

export async function POST() {
  try {
    console.log("Starting demo data seeding...")

    // Check if products already exist
    const productsSnapshot = await getDocs(collection(db, "products"))

    if (!productsSnapshot.empty) {
      console.log("Products already exist, skipping seeding")
      return NextResponse.json({
        success: true,
        message: "Demo products already exist",
        count: productsSnapshot.size,
        skipped: true,
      })
    }

    // Add demo products
    const addedProducts = []

    for (const product of demoProducts) {
      console.log(`Adding product: ${product.name}`)
      const docRef = await addDoc(collection(db, "products"), {
        ...product,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      addedProducts.push({ id: docRef.id, ...product })
      console.log(`Product added with ID: ${docRef.id}`)
    }

    console.log(`Successfully added ${addedProducts.length} products`)

    return NextResponse.json({
      success: true,
      message: `Successfully added ${addedProducts.length} demo products`,
      count: addedProducts.length,
      products: addedProducts.map((p) => ({ id: p.id, name: p.name, price: p.price })),
    })
  } catch (error: any) {
    console.error("Error adding demo data:", error)
    return NextResponse.json(
        {
          error: error.message || "Failed to add demo data",
          code: error.code || "unknown",
        },
        { status: 500 },
    )
  }
}
