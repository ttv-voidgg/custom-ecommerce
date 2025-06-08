import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { db } = await import("@/lib/firebase")
        const { doc, getDoc } = await import("firebase/firestore")

        if (!db) {
            throw new Error("Firestore database not initialized")
        }

        const categoryDoc = await getDoc(doc(db, "categories", params.id))

        if (!categoryDoc.exists()) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Category not found",
                },
                { status: 404 },
            )
        }

        const category = {
            id: categoryDoc.id,
            ...categoryDoc.data(),
        }

        return NextResponse.json({
            success: true,
            category,
        })
    } catch (error) {
        console.error("Error fetching category:", error)
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch category",
            },
            { status: 500 },
        )
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { db } = await import("@/lib/firebase")
        const { doc, updateDoc, getDoc, Timestamp, query, where, collection, getDocs } = await import("firebase/firestore")

        if (!db) {
            throw new Error("Firestore database not initialized")
        }

        const body = await request.json()
        const { name, description, slug, featured, bannerImage } = body

        if (!name || !slug) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Name and slug are required",
                },
                { status: 400 },
            )
        }

        // Check if category exists
        const categoryRef = doc(db, "categories", params.id)
        const categoryDoc = await getDoc(categoryRef)

        if (!categoryDoc.exists()) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Category not found",
                },
                { status: 404 },
            )
        }

        // Check if slug already exists (excluding current category)
        const categoriesRef = collection(db, "categories")
        const slugQuery = query(categoriesRef, where("slug", "==", slug))
        const existingCategories = await getDocs(slugQuery)

        const conflictingCategory = existingCategories.docs.find((doc) => doc.id !== params.id)
        if (conflictingCategory) {
            return NextResponse.json(
                {
                    success: false,
                    error: "A category with this slug already exists",
                },
                { status: 400 },
            )
        }

        // Check featured category limit
        if (featured) {
            const categoriesRef = collection(db, "categories")
            const featuredQuery = query(categoriesRef, where("featured", "==", true))
            const featuredCategories = await getDocs(featuredQuery)

            // Allow if this category is already featured, or if we're under the limit
            const currentlyFeatured = featuredCategories.docs.find((doc) => doc.id === params.id)
            if (!currentlyFeatured && featuredCategories.size >= 4) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "Maximum of 4 categories can be featured",
                    },
                    { status: 400 },
                )
            }
        }

        const updateData = {
            name,
            description: description || "",
            slug,
            featured: featured || false,
            bannerImage: bannerImage || "",
            updatedAt: Timestamp.now(),
        }

        await updateDoc(categoryRef, updateData)

        const updatedCategory = {
            id: params.id,
            ...categoryDoc.data(),
            ...updateData,
        }

        return NextResponse.json({
            success: true,
            category: updatedCategory,
        })
    } catch (error) {
        console.error("Error updating category:", error)
        return NextResponse.json(
            {
                success: false,
                error: "Failed to update category",
            },
            { status: 500 },
        )
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { db } = await import("@/lib/firebase")
        const { doc, deleteDoc, getDoc, collection, query, where, getDocs } = await import("firebase/firestore")

        if (!db) {
            throw new Error("Firestore database not initialized")
        }

        // Check if category exists
        const categoryRef = doc(db, "categories", params.id)
        const categoryDoc = await getDoc(categoryRef)

        if (!categoryDoc.exists()) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Category not found",
                },
                { status: 404 },
            )
        }

        // Check if any products use this category
        const productsRef = collection(db, "products")
        const categoryData = categoryDoc.data()
        const productsQuery = query(productsRef, where("category", "==", categoryData.slug))
        const productsSnapshot = await getDocs(productsQuery)

        if (!productsSnapshot.empty) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Cannot delete category with associated products",
                    productCount: productsSnapshot.size,
                },
                { status: 400 },
            )
        }

        await deleteDoc(categoryRef)

        return NextResponse.json({
            success: true,
            message: "Category deleted successfully",
        })
    } catch (error) {
        console.error("Error deleting category:", error)
        return NextResponse.json(
            {
                success: false,
                error: "Failed to delete category",
            },
            { status: 500 },
        )
    }
}
