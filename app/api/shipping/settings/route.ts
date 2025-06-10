import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
    try {
        const { db } = await import("@/lib/firebase")
        const { doc, getDoc } = await import("firebase/firestore")

        const settingsDoc = await getDoc(doc(db, "settings", "shipping"))

        if (settingsDoc.exists()) {
            return NextResponse.json({
                success: true,
                settings: settingsDoc.data(),
            })
        } else {
            // Return default settings
            const defaultSettings = {
                defaultCurrency: "USD",
                weightUnit: "kg",
                dimensionUnit: "cm",
                originAddress: {
                    country: "",
                    state: "",
                    city: "",
                    postalCode: "",
                    address: "",
                },
                zones: [
                    {
                        id: "domestic",
                        name: "Domestic",
                        countries: ["United States"],
                        methods: [
                            {
                                id: "standard",
                                name: "Standard Shipping",
                                type: "fixed",
                                price: 9.99,
                                estimatedDays: { min: 3, max: 7 },
                                enabled: true,
                            },
                        ],
                    },
                ],
                globalSettings: {
                    enableFreeShipping: false,
                    freeShippingThreshold: 100,
                    enableLocalPickup: false,
                    localPickupInstructions: "",
                },
            }

            return NextResponse.json({
                success: true,
                settings: defaultSettings,
            })
        }
    } catch (error) {
        console.error("Error fetching shipping settings:", error)
        return NextResponse.json({ success: false, error: "Failed to fetch shipping settings" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const settings = await request.json()

        const { db } = await import("@/lib/firebase")
        const { doc, setDoc, Timestamp } = await import("firebase/firestore")

        await setDoc(doc(db, "settings", "shipping"), {
            ...settings,
            updatedAt: Timestamp.now(),
        })

        return NextResponse.json({
            success: true,
            message: "Shipping settings saved successfully",
        })
    } catch (error) {
        console.error("Error saving shipping settings:", error)
        return NextResponse.json({ success: false, error: "Failed to save shipping settings" }, { status: 500 })
    }
}
