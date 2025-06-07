import { type NextRequest, NextResponse } from "next/server"
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

// GET - Get single product by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params

        console.log("Fetching product with ID:", id)

        const docRef = doc(db, "products", id)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Product not found",
                },
                { status: 404 },
            )
        }

        const product = {
            id: docSnap.id,
            ...docSnap.data(),
        }

        console.log("Product found:", product.name)

        return NextResponse.json({
            success: true,
            product,
        })
    } catch (error: any) {
        console.error("Error fetching product:", error)
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch product",
                details: error.message,
            },
            { status: 500 },
        )
    }
}

// PUT - Update product
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params
        const updateData = await request.json()

        console.log("Updating product with ID:", id, updateData)

        // Prepare update data
        const updatedProduct = {
            ...updateData,
            updatedAt: Timestamp.now(),
        }

        // Convert string numbers to actual numbers
        if (updatedProduct.price) updatedProduct.price = Number(updatedProduct.price)
        if (updatedProduct.originalPrice) updatedProduct.originalPrice = Number(updatedProduct.originalPrice)
        if (updatedProduct.stockQuantity) updatedProduct.stockQuantity = Number(updatedProduct.stockQuantity)
        if (updatedProduct.rating) updatedProduct.rating = Number(updatedProduct.rating)
        if (updatedProduct.reviews) updatedProduct.reviews = Number(updatedProduct.reviews)

        // Convert string booleans to actual booleans
        if (updatedProduct.inStock !== undefined) updatedProduct.inStock = Boolean(updatedProduct.inStock)
        if (updatedProduct.featured !== undefined) updatedProduct.featured = Boolean(updatedProduct.featured)

        // Remove undefined values
        Object.keys(updatedProduct).forEach((key) => {
            if (updatedProduct[key] === undefined) {
                delete updatedProduct[key]
            }
        })

        const docRef = doc(db, "products", id)
        await updateDoc(docRef, updatedProduct)

        console.log("Product updated successfully")

        return NextResponse.json({
            success: true,
            message: "Product updated successfully",
        })
    } catch (error: any) {
        console.error("Error updating product:", error)
        return NextResponse.json(
            {
                success: false,
                error: "Failed to update product",
                details: error.message,
            },
            { status: 500 },
        )
    }
}

// DELETE - Delete product
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params

        console.log("Deleting product with ID:", id)

        const docRef = doc(db, "products", id)
        await deleteDoc(docRef)

        console.log("Product deleted successfully")

        return NextResponse.json({
            success: true,
            message: "Product deleted successfully",
        })
    } catch (error: any) {
        console.error("Error deleting product:", error)
        return NextResponse.json(
            {
                success: false,
                error: "Failed to delete product",
                details: error.message,
            },
            { status: 500 },
        )
    }
}
