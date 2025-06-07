import { type NextRequest, NextResponse } from "next/server"
import { collection, getDocs, addDoc, query, orderBy, where, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

// GET - List all products with optional filtering
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get("category")
        const featured = searchParams.get("featured")
        const inStock = searchParams.get("inStock")

        console.log("Fetching products with filters:", { category, featured, inStock })

        let productsQuery = query(collection(db, "products"), orderBy("createdAt", "desc"))

        // Apply filters if provided
        if (category) {
            productsQuery = query(collection(db, "products"), where("category", "==", category), orderBy("createdAt", "desc"))
        }

        const querySnapshot = await getDocs(productsQuery)
        let products = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }))

        // Apply client-side filters for boolean values
        if (featured === "true") {
            products = products.filter((product) => product.featured === true)
        }
        if (inStock === "true") {
            products = products.filter((product) => product.inStock === true)
        }

        console.log(`Found ${products.length} products`)

        return NextResponse.json({
            success: true,
            products,
            count: products.length,
        })
    } catch (error: any) {
        console.error("Error fetching products:", error)
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch products",
                details: error.message,
            },
            { status: 500 },
        )
    }
}

// POST - Create new product
export async function POST(request: NextRequest) {
    try {
        const productData = await request.json()

        console.log("Creating new product:", productData)

        // Validate required fields
        const requiredFields = ["name", "description", "price", "category"]
        const missingFields = requiredFields.filter((field) => !productData[field])

        if (missingFields.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Missing required fields",
                    missingFields,
                },
                { status: 400 },
            )
        }

        // Prepare product data with defaults
        const newProduct = {
            name: productData.name,
            description: productData.description,
            price: Number(productData.price),
            originalPrice: productData.originalPrice ? Number(productData.originalPrice) : undefined,
            category: productData.category,
            images: productData.images || [],
            featuredImage:
                productData.featuredImage ||
                (productData.images && productData.images.length > 0 ? productData.images[0] : undefined),
            inStock: productData.inStock !== undefined ? Boolean(productData.inStock) : true,
            stockQuantity: productData.stockQuantity ? Number(productData.stockQuantity) : 0,
            rating: productData.rating ? Number(productData.rating) : 0,
            reviews: productData.reviews ? Number(productData.reviews) : 0,
            featured: productData.featured !== undefined ? Boolean(productData.featured) : false,
            tags: productData.tags || [],
            specifications: productData.specifications || {},
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        }

        // Remove undefined values
        Object.keys(newProduct).forEach((key) => {
            if (newProduct[key] === undefined) {
                delete newProduct[key]
            }
        })

        const docRef = await addDoc(collection(db, "products"), newProduct)

        console.log("Product created with ID:", docRef.id)

        return NextResponse.json({
            success: true,
            id: docRef.id,
            product: { id: docRef.id, ...newProduct },
            message: "Product created successfully",
        })
    } catch (error: any) {
        console.error("Error creating product:", error)
        return NextResponse.json(
            {
                success: false,
                error: "Failed to create product",
                details: error.message,
            },
            { status: 500 },
        )
    }
}
