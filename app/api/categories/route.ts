import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
    try {
        const { db } = await import("@/lib/firebase")
        const { collection, getDocs, orderBy, query } = await import("firebase/firestore")

        if (!db) {
            throw new Error("Firestore database not initialized")
        }

        const categoriesRef = collection(db, "categories")
        const q = query(categoriesRef, orderBy("name"))
        const querySnapshot = await getDocs(q)

        const categories = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }))

        console.log("Loaded categories from Firebase:", categories)

        return NextResponse.json({
            success: true,
            categories,
            count: categories.length,
        })
    } catch (error) {
        console.error("Error fetching categories:", error)
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch categories",
            },
            { status: 500 },
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const { db } = await import("@/lib/firebase")
        const { collection, addDoc, Timestamp, query, where, getDocs } = await import("firebase/firestore")

        if (!db) {
            throw new Error("Firestore database not initialized")
        }

        const body = await request.json()
        const { name, description, slug } = body

        if (!name || !slug) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Name and slug are required",
                },
                { status: 400 },
            )
        }

        // Check if slug already exists
        const categoriesRef = collection(db, "categories")
        const slugQuery = query(categoriesRef, where("slug", "==", slug))
        const existingCategories = await getDocs(slugQuery)

        if (!existingCategories.empty) {
            return NextResponse.json(
                {
                    success: false,
                    error: "A category with this slug already exists",
                },
                { status: 400 },
            )
        }

        // Match the structure from setup/database/route.ts
        const categoryData = {
            name,
            description: description || "",
            slug,
            createdAt: Timestamp.now(),
        }

        const docRef = await addDoc(categoriesRef, categoryData)

        return NextResponse.json({
            success: true,
            category: {
                id: docRef.id,
                ...categoryData,
            },
        })
    } catch (error) {
        console.error("Error creating category:", error)
        return NextResponse.json(
            {
                success: false,
                error: "Failed to create category",
            },
            { status: 500 },
        )
    }
}
