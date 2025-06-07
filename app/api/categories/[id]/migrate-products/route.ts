import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { db } = await import("@/lib/firebase")
        const { doc, deleteDoc, getDoc, collection, query, where, getDocs, updateDoc, writeBatch } = await import(
            "firebase/firestore"
            )

        if (!db) {
            throw new Error("Firestore database not initialized")
        }

        const body = await request.json()
        const { newCategoryId } = body

        if (!newCategoryId) {
            return NextResponse.json(
                {
                    success: false,
                    error: "New category ID is required",
                },
                { status: 400 },
            )
        }

        // Get the category to be deleted
        const oldCategoryRef = doc(db, "categories", params.id)
        const oldCategoryDoc = await getDoc(oldCategoryRef)

        if (!oldCategoryDoc.exists()) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Category not found",
                },
                { status: 404 },
            )
        }

        // Get the new category
        const newCategoryRef = doc(db, "categories", newCategoryId)
        const newCategoryDoc = await getDoc(newCategoryRef)

        if (!newCategoryDoc.exists()) {
            return NextResponse.json(
                {
                    success: false,
                    error: "New category not found",
                },
                { status: 404 },
            )
        }

        const oldCategoryData = oldCategoryDoc.data()
        const newCategoryData = newCategoryDoc.data()

        // Find all products using the old category (by slug)
        const productsRef = collection(db, "products")
        const productsQuery = query(productsRef, where("category", "==", oldCategoryData.slug))
        const productsSnapshot = await getDocs(productsQuery)

        if (productsSnapshot.empty) {
            // No products to migrate, just delete the category
            await deleteDoc(oldCategoryRef)
            return NextResponse.json({
                success: true,
                message: "Category deleted successfully (no products to migrate)",
                migratedCount: 0,
            })
        }

        // Use batch to update all products
        const batch = writeBatch(db)
        let migratedCount = 0

        productsSnapshot.docs.forEach((productDoc) => {
            batch.update(productDoc.ref, {
                category: newCategoryData.slug,
                updatedAt: new Date(),
            })
            migratedCount++
        })

        // Execute the batch update
        await batch.commit()

        // Delete the old category
        await deleteDoc(oldCategoryRef)

        return NextResponse.json({
            success: true,
            message: `Successfully migrated ${migratedCount} products from "${oldCategoryData.name}" to "${newCategoryData.name}" and deleted the old category`,
            migratedCount,
        })
    } catch (error) {
        console.error("Error migrating products:", error)
        return NextResponse.json(
            {
                success: false,
                error: "Failed to migrate products",
            },
            { status: 500 },
        )
    }
}
