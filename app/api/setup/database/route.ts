import { type NextRequest, NextResponse } from "next/server"
import { doc, setDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function POST(request: NextRequest) {
  try {
    const storeConfig = await request.json()

    try {
      console.log("Initializing database with config:", storeConfig)

      // Create store settings document
      try {
        console.log("Attempting to create store settings document...")
        await setDoc(doc(db, "settings", "store"), {
          name: storeConfig.storeName,
          description: storeConfig.storeDescription,
          currency: storeConfig.currency,
          logoUrl: storeConfig.logoUrl || "",
          setupComplete: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
        console.log("Store settings created successfully")
      } catch (error: any) {
        console.error("Error creating store settings:", error)

        // Check for permission errors
        if (error.code === "permission-denied" || error.message?.includes("PERMISSION_DENIED")) {
          return NextResponse.json(
              {
                success: false,
                error: "Firebase permission denied",
                details: "You need to update your Firestore security rules to allow writes during setup",
                code: error.code,
                instructions: [
                  "1. Go to Firebase Console: https://console.firebase.google.com",
                  "2. Select your project",
                  "3. Go to Firestore Database > Rules",
                  "4. Update your rules to allow writes during setup",
                  "5. Use the rules provided in the firebase-rules.txt file in your project",
                ],
                rulesExample: `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow setup operations
    match /{document=**} {
      allow read, write: if true; // Temporarily allow all operations during setup
    }
  }
}`,
              },
              { status: 403 },
          )
        }

        throw new Error(`Failed to create store settings: ${error.message || String(error)}`)
      }

      // Create initial categories
      const categories = [
        { name: "Rings", slug: "rings", description: "Elegant rings for every occasion" },
        { name: "Necklaces", slug: "necklaces", description: "Beautiful necklaces and pendants" },
        { name: "Earrings", slug: "earrings", description: "Stunning earrings collection" },
        { name: "Bracelets", slug: "bracelets", description: "Luxury bracelets and bangles" },
        { name: "Watches", slug: "watches", description: "Premium timepieces" },
      ]

      for (const category of categories) {
        try {
          await setDoc(doc(db, "categories", category.slug), {
            ...category,
            createdAt: Timestamp.now(),
          })
          console.log(`Category created: ${category.name}`)
        } catch (error) {
          console.error(`Error creating category ${category.name}:`, error)
          // Continue with other categories
        }
      }

      // Create initial site configuration
      try {
        await setDoc(doc(db, "settings", "site"), {
          theme: "luxury",
          primaryColor: "#1f2937",
          secondaryColor: "#f3f4f6",
          logoUrl: storeConfig.logoUrl || "",
          faviconUrl: "",
          socialMedia: {
            instagram: "",
            facebook: "",
            twitter: "",
          },
          contact: {
            email: storeConfig.adminEmail || "",
            phone: "",
            address: "",
          },
          createdAt: Timestamp.now(),
        })
        console.log("Site settings created")
      } catch (error) {
        console.error("Error creating site settings:", error)
        throw new Error(`Failed to create site settings: ${error instanceof Error ? error.message : String(error)}`)
      }

      return NextResponse.json({
        success: true,
        message: "Database initialized successfully",
        collections: ["settings", "categories"],
      })
    } catch (error: any) {
      console.error("Error initializing database:", error)
      return NextResponse.json(
          {
            error: error.message || "Failed to initialize database",
            code: error.code || "unknown",
            details: error.stack || "No stack trace available",
          },
          { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error initializing database:", error)
    return NextResponse.json(
        {
          error: error.message || "Failed to initialize database",
          code: error.code || "unknown",
          details: error.stack || "No stack trace available",
        },
        { status: 500 },
    )
  }
}
