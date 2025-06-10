import { type NextRequest, NextResponse } from "next/server"

interface ShippingCalculationRequest {
    origin: {
        country: string
        state: string
        city: string
        postalCode: string
    }
    destination: {
        country: string
        state: string
        city: string
        postalCode: string
    }
    package: {
        weight: number
        length: number
        width: number
        height: number
        value: number
    }
    service?: string
}

interface ShippingRate {
    service: string
    rate: number
    currency: string
    estimatedDays: { min: number; max: number }
    carrier: string
}

// Free shipping calculation APIs (no account required)
async function calculateWithOpenShippingAPI(request: ShippingCalculationRequest): Promise<ShippingRate[]> {
    try {
        // Using a hypothetical free shipping API
        // In reality, you might use services like:
        // - Canada Post (has free tier)
        // - Some postal services offer free rate calculation
        // - Distance-based calculation using free geocoding APIs

        const distance = await calculateDistance(request.origin, request.destination)
        const baseRate = calculateDistanceBasedRate(distance, request.package.weight)

        return [
            {
                service: "Standard",
                rate: baseRate,
                currency: "USD",
                estimatedDays: { min: 3, max: 7 },
                carrier: "Standard Delivery",
            },
            {
                service: "Express",
                rate: baseRate * 1.5,
                currency: "USD",
                estimatedDays: { min: 1, max: 3 },
                carrier: "Express Delivery",
            },
        ]
    } catch (error) {
        console.error("Error calculating shipping with free API:", error)
        return []
    }
}

async function calculateDistance(origin: any, destination: any): Promise<number> {
    try {
        // Using free geocoding service (like OpenStreetMap Nominatim)
        const originCoords = await geocodeAddress(`${origin.city}, ${origin.state}, ${origin.country}`)
        const destCoords = await geocodeAddress(`${destination.city}, ${destination.state}, ${destination.country}`)

        if (!originCoords || !destCoords) {
            return 1000 // Default distance if geocoding fails
        }

        // Calculate distance using Haversine formula
        const R = 6371 // Earth's radius in kilometers
        const dLat = ((destCoords.lat - originCoords.lat) * Math.PI) / 180
        const dLon = ((destCoords.lon - originCoords.lon) * Math.PI) / 180
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((originCoords.lat * Math.PI) / 180) *
            Math.cos((destCoords.lat * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = R * c

        return distance
    } catch (error) {
        console.error("Error calculating distance:", error)
        return 1000 // Default distance
    }
}

async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
    try {
        // Using free Nominatim API (OpenStreetMap)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
            {
                headers: {
                    "User-Agent": "YourEcommerceApp/1.0",
                },
            },
        )

        const data = await response.json()
        if (data && data.length > 0) {
            return {
                lat: Number.parseFloat(data[0].lat),
                lon: Number.parseFloat(data[0].lon),
            }
        }
        return null
    } catch (error) {
        console.error("Geocoding error:", error)
        return null
    }
}

function calculateDistanceBasedRate(distance: number, weight: number): number {
    // Simple distance and weight-based calculation
    const baseRate = 5.0
    const distanceRate = distance * 0.01 // $0.01 per km
    const weightRate = weight * 0.5 // $0.50 per kg

    return Math.max(baseRate + distanceRate + weightRate, 2.0) // Minimum $2.00
}

// Integration with major carriers (requires API keys)
async function calculateWithCarrierAPIs(request: ShippingCalculationRequest): Promise<ShippingRate[]> {
    const rates: ShippingRate[] = []

    // USPS (US Postal Service) - has free tier for some services
    try {
        // USPS API integration would go here
        // They offer free rate calculation for domestic US shipping
    } catch (error) {
        console.error("USPS calculation error:", error)
    }

    // Canada Post - has free tier
    try {
        // Canada Post API integration would go here
    } catch (error) {
        console.error("Canada Post calculation error:", error)
    }

    return rates
}

export async function POST(request: NextRequest) {
    try {
        const body: ShippingCalculationRequest = await request.json()

        // Validate required fields
        if (!body.origin || !body.destination || !body.package) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Calculate shipping rates using available methods
        const rates: ShippingRate[] = []

        // Try free APIs first
        const freeApiRates = await calculateWithOpenShippingAPI(body)
        rates.push(...freeApiRates)

        // Try carrier APIs if available
        const carrierRates = await calculateWithCarrierAPIs(body)
        rates.push(...carrierRates)

        // If no rates found, provide fallback rates
        if (rates.length === 0) {
            rates.push({
                service: "Standard Shipping",
                rate: 9.99,
                currency: "USD",
                estimatedDays: { min: 3, max: 7 },
                carrier: "Standard",
            })
        }

        return NextResponse.json({
            success: true,
            rates: rates.sort((a, b) => a.rate - b.rate), // Sort by price
        })
    } catch (error) {
        console.error("Shipping calculation error:", error)
        return NextResponse.json({ error: "Failed to calculate shipping rates" }, { status: 500 })
    }
}
