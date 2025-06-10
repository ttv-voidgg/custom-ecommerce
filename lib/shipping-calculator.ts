interface ShippingMethod {
    id: string
    name: string
    type: "free" | "fixed" | "calculated" | "weight_based" | "distance_based"
    price?: number
    freeThreshold?: number
    weightRates?: { min: number; max: number; rate: number }[]
    distanceRates?: { min: number; max: number; rate: number }[]
    estimatedDays?: { min: number; max: number }
    enabled: boolean
}

interface ShippingZone {
    id: string
    name: string
    countries: string[]
    methods: ShippingMethod[]
}

interface ShippingSettings {
    defaultCurrency: string
    weightUnit: "kg" | "lb"
    dimensionUnit: "cm" | "in"
    originAddress: {
        country: string
        state: string
        city: string
        postalCode: string
        address: string
    }
    zones: ShippingZone[]
    globalSettings: {
        enableFreeShipping: boolean
        freeShippingThreshold: number
        enableLocalPickup: boolean
        localPickupInstructions: string
    }
}

interface CartItem {
    id: string
    name: string
    price: number
    quantity: number
    weight?: number
}

interface ShippingDestination {
    country: string
    state?: string
    city?: string
    postalCode?: string
}

export interface CalculatedShippingOption {
    id: string
    name: string
    price: number
    estimatedDays?: { min: number; max: number }
    description?: string
}

export class ShippingCalculator {
    private settings: ShippingSettings

    constructor(settings: ShippingSettings) {
        this.settings = settings
    }

    async calculateShipping(
        cartItems: CartItem[],
        destination: ShippingDestination,
        cartTotal: number,
    ): Promise<CalculatedShippingOption[]> {
        const options: CalculatedShippingOption[] = []

        // Check for global free shipping
        if (
            this.settings.globalSettings.enableFreeShipping &&
            cartTotal >= this.settings.globalSettings.freeShippingThreshold
        ) {
            options.push({
                id: "free_global",
                name: "Free Shipping",
                price: 0,
                estimatedDays: { min: 3, max: 7 },
                description: `Free shipping on orders over ${this.settings.defaultCurrency} ${this.settings.globalSettings.freeShippingThreshold}`,
            })
        }

        // Add local pickup if enabled
        if (this.settings.globalSettings.enableLocalPickup) {
            options.push({
                id: "local_pickup",
                name: "Local Pickup",
                price: 0,
                estimatedDays: { min: 1, max: 1 },
                description: this.settings.globalSettings.localPickupInstructions || "Pick up at our location",
            })
        }

        // Find applicable shipping zone
        const zone = this.findShippingZone(destination.country)
        if (!zone) {
            // No zone found, return basic options
            return options
        }

        // Calculate shipping for each method in the zone
        for (const method of zone.methods) {
            if (!method.enabled) continue

            const calculatedOption = await this.calculateMethodPrice(method, cartItems, destination, cartTotal)
            if (calculatedOption) {
                options.push(calculatedOption)
            }
        }

        // Sort by price (free options first, then by price)
        return options.sort((a, b) => {
            if (a.price === 0 && b.price > 0) return -1
            if (b.price === 0 && a.price > 0) return 1
            return a.price - b.price
        })
    }

    private findShippingZone(country: string): ShippingZone | null {
        return this.settings.zones.find((zone) => zone.countries.includes(country)) || null
    }

    private async calculateMethodPrice(
        method: ShippingMethod,
        cartItems: CartItem[],
        destination: ShippingDestination,
        cartTotal: number,
    ): Promise<CalculatedShippingOption | null> {
        switch (method.type) {
            case "free":
                if (!method.freeThreshold || cartTotal >= method.freeThreshold) {
                    return {
                        id: method.id,
                        name: method.name,
                        price: 0,
                        estimatedDays: method.estimatedDays,
                        description: method.freeThreshold
                            ? `Free shipping on orders over ${this.settings.defaultCurrency} ${method.freeThreshold}`
                            : "Free shipping",
                    }
                }
                return null

            case "fixed":
                return {
                    id: method.id,
                    name: method.name,
                    price: method.price || 0,
                    estimatedDays: method.estimatedDays,
                }

            case "weight_based":
                return this.calculateWeightBasedShipping(method, cartItems)

            case "distance_based":
                return await this.calculateDistanceBasedShipping(method, destination)

            case "calculated":
                return await this.calculateAPIShipping(method, cartItems, destination)

            default:
                return null
        }
    }

    private calculateWeightBasedShipping(method: ShippingMethod, cartItems: CartItem[]): CalculatedShippingOption | null {
        const totalWeight = cartItems.reduce((sum, item) => sum + (item.weight || 0.5) * item.quantity, 0)

        if (!method.weightRates || method.weightRates.length === 0) {
            return {
                id: method.id,
                name: method.name,
                price: method.price || 0,
                estimatedDays: method.estimatedDays,
            }
        }

        // Find applicable weight rate
        const applicableRate = method.weightRates.find(
            (rate) => totalWeight >= rate.min && (rate.max === -1 || totalWeight <= rate.max),
        )

        if (!applicableRate) {
            return null
        }

        return {
            id: method.id,
            name: method.name,
            price: applicableRate.rate,
            estimatedDays: method.estimatedDays,
            description: `Based on ${totalWeight.toFixed(1)} ${this.settings.weightUnit} total weight`,
        }
    }

    private async calculateDistanceBasedShipping(
        method: ShippingMethod,
        destination: ShippingDestination,
    ): Promise<CalculatedShippingOption | null> {
        try {
            // Calculate distance using a simple approximation
            // In a real implementation, you'd use a geocoding service
            const distance = await this.calculateDistance(this.settings.originAddress, destination)

            if (!method.distanceRates || method.distanceRates.length === 0) {
                return {
                    id: method.id,
                    name: method.name,
                    price: method.price || 0,
                    estimatedDays: method.estimatedDays,
                }
            }

            const applicableRate = method.distanceRates.find(
                (rate) => distance >= rate.min && (rate.max === -1 || distance <= rate.max),
            )

            if (!applicableRate) {
                return null
            }

            return {
                id: method.id,
                name: method.name,
                price: applicableRate.rate,
                estimatedDays: method.estimatedDays,
                description: `Based on ${distance.toFixed(0)} km distance`,
            }
        } catch (error) {
            console.error("Error calculating distance-based shipping:", error)
            return null
        }
    }

    private async calculateAPIShipping(
        method: ShippingMethod,
        cartItems: CartItem[],
        destination: ShippingDestination,
    ): Promise<CalculatedShippingOption | null> {
        try {
            // This would integrate with real shipping APIs
            // For now, return a calculated estimate
            const totalWeight = cartItems.reduce((sum, item) => sum + (item.weight || 0.5) * item.quantity, 0)
            const baseRate = 15.99
            const weightRate = totalWeight * 2.5

            return {
                id: method.id,
                name: method.name,
                price: Math.round((baseRate + weightRate) * 100) / 100,
                estimatedDays: method.estimatedDays,
                description: "Calculated via shipping API",
            }
        } catch (error) {
            console.error("Error calculating API shipping:", error)
            return null
        }
    }

    private async calculateDistance(
        origin: { country: string; state: string; city: string },
        destination: { country: string; state?: string; city?: string },
    ): Promise<number> {
        // Simple distance calculation - in reality you'd use a geocoding service
        // For now, return estimated distances based on country
        if (origin.country === destination.country) {
            return 500 // Domestic shipping
        } else {
            return 2000 // International shipping
        }
    }
}

export async function getShippingSettings(): Promise<ShippingSettings | null> {
    try {
        const response = await fetch("/api/shipping/settings")
        const result = await response.json()

        if (result.success) {
            return result.settings
        }
        return null
    } catch (error) {
        console.error("Error fetching shipping settings:", error)
        return null
    }
}
