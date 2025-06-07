import { NextResponse } from "next/server"
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

const initialProducts = [
  {
    name: "Diamond Solitaire Ring",
    description: "Elegant 1-carat diamond solitaire ring in 18k white gold setting",
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
    description: "Classic freshwater pearl drop earrings with gold accents",
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
    description: "Delicate 18k gold chain necklace, perfect for layering",
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
    description: "Stunning diamond tennis bracelet with brilliant cut diamonds",
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
    description: "Vibrant emerald stud earrings in platinum setting",
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
    description: "Simple yet elegant rose gold wedding band",
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
    description: "Royal blue sapphire pendant with diamond halo",
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
    name: "Vintage Brooch",
    description: "Art Deco inspired vintage brooch with intricate details",
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
    // Check if products already exist
    const productsSnapshot = await getDocs(collection(db, "products"))

    if (!productsSnapshot.empty) {
      return NextResponse.json({
        message: "Products already exist in database",
        count: productsSnapshot.size,
      })
    }

    // Add initial products
    const addedProducts = []

    for (const product of initialProducts) {
      const docRef = await addDoc(collection(db, "products"), {
        ...product,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      addedProducts.push({ id: docRef.id, ...product })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${addedProducts.length} products`,
      products: addedProducts,
    })
  } catch (error) {
    console.error("Error seeding products:", error)
    return NextResponse.json(
      {
        error: "Failed to seed products",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
