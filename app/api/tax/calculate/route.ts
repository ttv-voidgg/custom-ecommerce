import { type NextRequest, NextResponse } from "next/server"

// Separate tax rates by jurisdiction
const TAX_RATES: Record<string, { taxes: Array<{ name: string; rate: number; type: string }>; location: string }> = {
    // US States - Sales Tax
    AL: { taxes: [{ name: "Alabama Sales Tax", rate: 0.04, type: "sales" }], location: "Alabama" },
    AK: { taxes: [], location: "Alaska" }, // No state sales tax
    AZ: { taxes: [{ name: "Arizona Sales Tax", rate: 0.056, type: "sales" }], location: "Arizona" },
    AR: { taxes: [{ name: "Arkansas Sales Tax", rate: 0.065, type: "sales" }], location: "Arkansas" },
    CA: { taxes: [{ name: "California Sales Tax", rate: 0.0725, type: "sales" }], location: "California" },
    CO: { taxes: [{ name: "Colorado Sales Tax", rate: 0.029, type: "sales" }], location: "Colorado" },
    CT: { taxes: [{ name: "Connecticut Sales Tax", rate: 0.0635, type: "sales" }], location: "Connecticut" },
    DE: { taxes: [], location: "Delaware" }, // No state sales tax
    FL: { taxes: [{ name: "Florida Sales Tax", rate: 0.06, type: "sales" }], location: "Florida" },
    GA: { taxes: [{ name: "Georgia Sales Tax", rate: 0.04, type: "sales" }], location: "Georgia" },
    HI: { taxes: [{ name: "Hawaii General Excise Tax", rate: 0.04, type: "excise" }], location: "Hawaii" },
    ID: { taxes: [{ name: "Idaho Sales Tax", rate: 0.06, type: "sales" }], location: "Idaho" },
    IL: { taxes: [{ name: "Illinois Sales Tax", rate: 0.0625, type: "sales" }], location: "Illinois" },
    IN: { taxes: [{ name: "Indiana Sales Tax", rate: 0.07, type: "sales" }], location: "Indiana" },
    IA: { taxes: [{ name: "Iowa Sales Tax", rate: 0.06, type: "sales" }], location: "Iowa" },
    KS: { taxes: [{ name: "Kansas Sales Tax", rate: 0.065, type: "sales" }], location: "Kansas" },
    KY: { taxes: [{ name: "Kentucky Sales Tax", rate: 0.06, type: "sales" }], location: "Kentucky" },
    LA: { taxes: [{ name: "Louisiana Sales Tax", rate: 0.0445, type: "sales" }], location: "Louisiana" },
    ME: { taxes: [{ name: "Maine Sales Tax", rate: 0.055, type: "sales" }], location: "Maine" },
    MD: { taxes: [{ name: "Maryland Sales Tax", rate: 0.06, type: "sales" }], location: "Maryland" },
    MA: { taxes: [{ name: "Massachusetts Sales Tax", rate: 0.0625, type: "sales" }], location: "Massachusetts" },
    MI: { taxes: [{ name: "Michigan Sales Tax", rate: 0.06, type: "sales" }], location: "Michigan" },
    MN: { taxes: [{ name: "Minnesota Sales Tax", rate: 0.06875, type: "sales" }], location: "Minnesota" },
    MS: { taxes: [{ name: "Mississippi Sales Tax", rate: 0.07, type: "sales" }], location: "Mississippi" },
    MO: { taxes: [{ name: "Missouri Sales Tax", rate: 0.04225, type: "sales" }], location: "Missouri" },
    MT: { taxes: [], location: "Montana" }, // No state sales tax
    NE: { taxes: [{ name: "Nebraska Sales Tax", rate: 0.055, type: "sales" }], location: "Nebraska" },
    NV: { taxes: [{ name: "Nevada Sales Tax", rate: 0.0685, type: "sales" }], location: "Nevada" },
    NH: { taxes: [], location: "New Hampshire" }, // No state sales tax
    NJ: { taxes: [{ name: "New Jersey Sales Tax", rate: 0.06625, type: "sales" }], location: "New Jersey" },
    NM: {
        taxes: [{ name: "New Mexico Gross Receipts Tax", rate: 0.05125, type: "gross_receipts" }],
        location: "New Mexico",
    },
    NY: { taxes: [{ name: "New York Sales Tax", rate: 0.08, type: "sales" }], location: "New York" },
    NC: { taxes: [{ name: "North Carolina Sales Tax", rate: 0.0475, type: "sales" }], location: "North Carolina" },
    ND: { taxes: [{ name: "North Dakota Sales Tax", rate: 0.05, type: "sales" }], location: "North Dakota" },
    OH: { taxes: [{ name: "Ohio Sales Tax", rate: 0.0575, type: "sales" }], location: "Ohio" },
    OK: { taxes: [{ name: "Oklahoma Sales Tax", rate: 0.045, type: "sales" }], location: "Oklahoma" },
    OR: { taxes: [], location: "Oregon" }, // No state sales tax
    PA: { taxes: [{ name: "Pennsylvania Sales Tax", rate: 0.06, type: "sales" }], location: "Pennsylvania" },
    RI: { taxes: [{ name: "Rhode Island Sales Tax", rate: 0.07, type: "sales" }], location: "Rhode Island" },
    SC: { taxes: [{ name: "South Carolina Sales Tax", rate: 0.06, type: "sales" }], location: "South Carolina" },
    SD: { taxes: [{ name: "South Dakota Sales Tax", rate: 0.045, type: "sales" }], location: "South Dakota" },
    TN: { taxes: [{ name: "Tennessee Sales Tax", rate: 0.07, type: "sales" }], location: "Tennessee" },
    TX: { taxes: [{ name: "Texas Sales Tax", rate: 0.0625, type: "sales" }], location: "Texas" },
    UT: { taxes: [{ name: "Utah Sales Tax", rate: 0.0485, type: "sales" }], location: "Utah" },
    VT: { taxes: [{ name: "Vermont Sales Tax", rate: 0.06, type: "sales" }], location: "Vermont" },
    VA: { taxes: [{ name: "Virginia Sales Tax", rate: 0.053, type: "sales" }], location: "Virginia" },
    WA: { taxes: [{ name: "Washington Sales Tax", rate: 0.065, type: "sales" }], location: "Washington" },
    WV: { taxes: [{ name: "West Virginia Sales Tax", rate: 0.06, type: "sales" }], location: "West Virginia" },
    WI: { taxes: [{ name: "Wisconsin Sales Tax", rate: 0.05, type: "sales" }], location: "Wisconsin" },
    WY: { taxes: [{ name: "Wyoming Sales Tax", rate: 0.04, type: "sales" }], location: "Wyoming" },
    DC: {
        taxes: [{ name: "District of Columbia Sales Tax", rate: 0.06, type: "sales" }],
        location: "District of Columbia",
    },

    // Canadian Provinces - Separate GST, PST, HST
    AB: {
        taxes: [{ name: "GST", rate: 0.05, type: "gst" }],
        location: "Alberta",
    },
    BC: {
        taxes: [
            { name: "GST", rate: 0.05, type: "gst" },
            { name: "PST", rate: 0.07, type: "pst" },
        ],
        location: "British Columbia",
    },
    MB: {
        taxes: [
            { name: "GST", rate: 0.05, type: "gst" },
            { name: "PST", rate: 0.07, type: "pst" },
        ],
        location: "Manitoba",
    },
    NB: {
        taxes: [{ name: "HST", rate: 0.15, type: "hst" }],
        location: "New Brunswick",
    },
    NL: {
        taxes: [{ name: "HST", rate: 0.15, type: "hst" }],
        location: "Newfoundland and Labrador",
    },
    NS: {
        taxes: [{ name: "HST", rate: 0.15, type: "hst" }],
        location: "Nova Scotia",
    },
    ON: {
        taxes: [{ name: "HST", rate: 0.13, type: "hst" }],
        location: "Ontario",
    },
    PE: {
        taxes: [{ name: "HST", rate: 0.15, type: "hst" }],
        location: "Prince Edward Island",
    },
    QC: {
        taxes: [
            { name: "GST", rate: 0.05, type: "gst" },
            { name: "QST", rate: 0.09975, type: "qst" },
        ],
        location: "Quebec",
    },
    SK: {
        taxes: [
            { name: "GST", rate: 0.05, type: "gst" },
            { name: "PST", rate: 0.06, type: "pst" },
        ],
        location: "Saskatchewan",
    },
    NT: {
        taxes: [{ name: "GST", rate: 0.05, type: "gst" }],
        location: "Northwest Territories",
    },
    NU: {
        taxes: [{ name: "GST", rate: 0.05, type: "gst" }],
        location: "Nunavut",
    },
    YT: {
        taxes: [{ name: "GST", rate: 0.05, type: "gst" }],
        location: "Yukon",
    },

    // Default rates
    DEFAULT_US: {
        taxes: [{ name: "US Sales Tax", rate: 0.07, type: "sales" }],
        location: "United States (Default)",
    },
    DEFAULT_CA: {
        taxes: [
            { name: "GST", rate: 0.05, type: "gst" },
            { name: "PST", rate: 0.07, type: "pst" },
        ],
        location: "Canada (Default)",
    },
    DEFAULT_INTERNATIONAL: {
        taxes: [],
        location: "International (Tax Free)",
    },
}

export async function POST(request: NextRequest) {
    try {
        const { subtotal, shippingAddress, userLocation } = await request.json()

        if (!subtotal || subtotal <= 0) {
            return NextResponse.json({ error: "Invalid subtotal" }, { status: 400 })
        }

        let taxData = TAX_RATES.DEFAULT_INTERNATIONAL
        let detectedLocation = "Unknown"

        // Priority 1: Use shipping address if provided
        if (shippingAddress?.state && shippingAddress?.country) {
            const country = shippingAddress.country.toUpperCase()
            const state = shippingAddress.state.toUpperCase()

            if (country === "UNITED STATES" || country === "US" || country === "USA") {
                const stateCode = getStateCode(state)
                if (stateCode && TAX_RATES[stateCode]) {
                    taxData = TAX_RATES[stateCode]
                    detectedLocation = `Shipping Address: ${taxData.location}`
                } else {
                    taxData = TAX_RATES.DEFAULT_US
                    detectedLocation = `Shipping Address: ${taxData.location}`
                }
            } else if (country === "CANADA" || country === "CA") {
                const provinceCode = getProvinceCode(state)
                if (provinceCode && TAX_RATES[provinceCode]) {
                    taxData = TAX_RATES[provinceCode]
                    detectedLocation = `Shipping Address: ${taxData.location}`
                } else {
                    taxData = TAX_RATES.DEFAULT_CA
                    detectedLocation = `Shipping Address: ${taxData.location}`
                }
            } else {
                taxData = TAX_RATES.DEFAULT_INTERNATIONAL
                detectedLocation = `Shipping Address: International`
            }
        }
        // Priority 2: Use detected user location
        else if (userLocation?.country) {
            const country = userLocation.country.toUpperCase()
            const region = userLocation.region?.toUpperCase()

            if (country === "US" || country === "USA") {
                if (region && TAX_RATES[region]) {
                    taxData = TAX_RATES[region]
                    detectedLocation = `Detected Location: ${taxData.location}`
                } else {
                    taxData = TAX_RATES.DEFAULT_US
                    detectedLocation = `Detected Location: ${taxData.location}`
                }
            } else if (country === "CA" || country === "CANADA") {
                if (region && TAX_RATES[region]) {
                    taxData = TAX_RATES[region]
                    detectedLocation = `Detected Location: ${taxData.location}`
                } else {
                    taxData = TAX_RATES.DEFAULT_CA
                    detectedLocation = `Detected Location: ${taxData.location}`
                }
            } else {
                taxData = TAX_RATES.DEFAULT_INTERNATIONAL
                detectedLocation = `Detected Location: International`
            }
        }
        // Priority 3: Try to get location from IP
        else {
            try {
                const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

                // Use a free IP geolocation service
                const geoResponse = await fetch(
                    `http://ip-api.com/json/${clientIP}?fields=country,countryCode,region,regionName`,
                )
                const geoData = await geoResponse.json()

                if (geoData.status === "success") {
                    const country = geoData.countryCode?.toUpperCase()
                    const region = geoData.region?.toUpperCase()

                    if (country === "US") {
                        if (region && TAX_RATES[region]) {
                            taxData = TAX_RATES[region]
                            detectedLocation = `IP Location: ${taxData.location}`
                        } else {
                            taxData = TAX_RATES.DEFAULT_US
                            detectedLocation = `IP Location: ${taxData.location}`
                        }
                    } else if (country === "CA") {
                        if (region && TAX_RATES[region]) {
                            taxData = TAX_RATES[region]
                            detectedLocation = `IP Location: ${taxData.location}`
                        } else {
                            taxData = TAX_RATES.DEFAULT_CA
                            detectedLocation = `IP Location: ${taxData.location}`
                        }
                    } else {
                        taxData = TAX_RATES.DEFAULT_INTERNATIONAL
                        detectedLocation = `IP Location: International`
                    }
                }
            } catch (error) {
                console.error("Error getting location from IP:", error)
                taxData = TAX_RATES.DEFAULT_INTERNATIONAL
                detectedLocation = "Location Detection Failed"
            }
        }

        // Calculate individual tax amounts
        const taxes = taxData.taxes.map((tax) => ({
            name: tax.name,
            type: tax.type,
            rate: tax.rate,
            amount: Math.round(subtotal * tax.rate * 100) / 100,
        }))

        const totalTaxAmount = taxes.reduce((sum, tax) => sum + tax.amount, 0)
        const totalTaxRate = taxes.reduce((sum, tax) => sum + tax.rate, 0)

        return NextResponse.json({
            success: true,
            taxes,
            totalTaxRate,
            totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
            taxLocation: taxData.location,
            detectedLocation,
            subtotal,
            total: subtotal + totalTaxAmount,
        })
    } catch (error) {
        console.error("Error calculating tax:", error)
        return NextResponse.json({ error: "Failed to calculate tax" }, { status: 500 })
    }
}

// Helper function to convert state names to codes
function getStateCode(state: string): string | null {
    const stateMap: Record<string, string> = {
        ALABAMA: "AL",
        ALASKA: "AK",
        ARIZONA: "AZ",
        ARKANSAS: "AR",
        CALIFORNIA: "CA",
        COLORADO: "CO",
        CONNECTICUT: "CT",
        DELAWARE: "DE",
        FLORIDA: "FL",
        GEORGIA: "GA",
        HAWAII: "HI",
        IDAHO: "ID",
        ILLINOIS: "IL",
        INDIANA: "IN",
        IOWA: "IA",
        KANSAS: "KS",
        KENTUCKY: "KY",
        LOUISIANA: "LA",
        MAINE: "ME",
        MARYLAND: "MD",
        MASSACHUSETTS: "MA",
        MICHIGAN: "MI",
        MINNESOTA: "MN",
        MISSISSIPPI: "MS",
        MISSOURI: "MO",
        MONTANA: "MT",
        NEBRASKA: "NE",
        NEVADA: "NV",
        "NEW HAMPSHIRE": "NH",
        "NEW JERSEY": "NJ",
        "NEW MEXICO": "NM",
        "NEW YORK": "NY",
        "NORTH CAROLINA": "NC",
        "NORTH DAKOTA": "ND",
        OHIO: "OH",
        OKLAHOMA: "OK",
        OREGON: "OR",
        PENNSYLVANIA: "PA",
        "RHODE ISLAND": "RI",
        "SOUTH CAROLINA": "SC",
        "SOUTH DAKOTA": "SD",
        TENNESSEE: "TN",
        TEXAS: "TX",
        UTAH: "UT",
        VERMONT: "VT",
        VIRGINIA: "VA",
        WASHINGTON: "WA",
        "WEST VIRGINIA": "WV",
        WISCONSIN: "WI",
        WYOMING: "WY",
        "DISTRICT OF COLUMBIA": "DC",
    }

    return stateMap[state] || (state.length === 2 ? state : null)
}

// Helper function to convert province names to codes
function getProvinceCode(province: string): string | null {
    const provinceMap: Record<string, string> = {
        ALBERTA: "AB",
        "BRITISH COLUMBIA": "BC",
        MANITOBA: "MB",
        "NEW BRUNSWICK": "NB",
        "NEWFOUNDLAND AND LABRADOR": "NL",
        "NOVA SCOTIA": "NS",
        ONTARIO: "ON",
        "PRINCE EDWARD ISLAND": "PE",
        QUEBEC: "QC",
        SASKATCHEWAN: "SK",
        "NORTHWEST TERRITORIES": "NT",
        NUNAVUT: "NU",
        YUKON: "YT",
    }

    return provinceMap[province] || (province.length === 2 ? province : null)
}
