"use client"

import { useState, useEffect } from "react"

interface LocationData {
    country?: string
    region?: string
    city?: string
    latitude?: number
    longitude?: number
    loading: boolean
    error?: string
}

export function useLocation() {
    const [location, setLocation] = useState<LocationData>({ loading: true })

    useEffect(() => {
        const getLocation = async () => {
            try {
                // First try to get precise location with user permission
                if ("geolocation" in navigator) {
                    navigator.geolocation.getCurrentPosition(
                        async (position) => {
                            try {
                                // Use reverse geocoding to get location details
                                const response = await fetch(
                                    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`,
                                )
                                const data = await response.json()

                                setLocation({
                                    country: data.countryCode,
                                    region: data.principalSubdivisionCode?.split("-")[1], // Get state/province code
                                    city: data.city,
                                    latitude: position.coords.latitude,
                                    longitude: position.coords.longitude,
                                    loading: false,
                                })
                            } catch (error) {
                                console.error("Error with reverse geocoding:", error)
                                // Fall back to IP-based location
                                await getIPLocation()
                            }
                        },
                        async (error) => {
                            console.error("Geolocation error:", error)
                            // Fall back to IP-based location
                            await getIPLocation()
                        },
                        {
                            timeout: 10000,
                            enableHighAccuracy: false,
                        },
                    )
                } else {
                    // Geolocation not supported, use IP-based location
                    await getIPLocation()
                }
            } catch (error) {
                console.error("Error getting location:", error)
                setLocation({
                    loading: false,
                    error: "Unable to determine location",
                })
            }
        }

        const getIPLocation = async () => {
            try {
                const response = await fetch("http://ip-api.com/json/?fields=country,countryCode,region,regionName,city")
                const data = await response.json()

                if (data.status === "success") {
                    setLocation({
                        country: data.countryCode,
                        region: data.region,
                        city: data.city,
                        loading: false,
                    })
                } else {
                    throw new Error("IP location failed")
                }
            } catch (error) {
                console.error("Error with IP location:", error)
                setLocation({
                    loading: false,
                    error: "Unable to determine location",
                })
            }
        }

        getLocation()
    }, [])

    return location
}
