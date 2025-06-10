"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2, Plus, Trash2, MapPin, Calculator } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

interface ShippingZone {
    id: string
    name: string
    countries: string[]
    methods: ShippingMethod[]
}

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

const COUNTRIES = [
    "United States",
    "Canada",
    "United Kingdom",
    "Australia",
    "Germany",
    "France",
    "Japan",
    "Singapore",
    "Malaysia",
    "Thailand",
    "Philippines",
    "Indonesia",
    "Vietnam",
    "South Korea",
    "China",
    "India",
]

export default function AdminShippingPage() {
    const { user, isAdmin, loading } = useAuth()
    const router = useRouter()
    const { toast } = useToast()

    const [settings, setSettings] = useState<ShippingSettings>({
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
        zones: [],
        globalSettings: {
            enableFreeShipping: false,
            freeShippingThreshold: 100,
            enableLocalPickup: false,
            localPickupInstructions: "",
        },
    })

    const [saving, setSaving] = useState(false)
    const [loadingSettings, setLoadingSettings] = useState(true)

    useEffect(() => {
        if (!loading && (!user || !isAdmin)) {
            router.push("/auth")
        }
    }, [user, isAdmin, loading, router])

    useEffect(() => {
        if (user && isAdmin) {
            loadSettings()
        }
    }, [user, isAdmin])

    const loadSettings = async () => {
        try {
            const response = await fetch("/api/shipping/settings")
            const result = await response.json()

            if (result.success) {
                setSettings(result.settings)
            } else {
                throw new Error(result.error)
            }
        } catch (error) {
            console.error("Error loading shipping settings:", error)
            toast({
                title: "Error",
                description: "Failed to load shipping settings",
                variant: "destructive",
            })
        } finally {
            setLoadingSettings(false)
        }
    }

    const addShippingZone = () => {
        const newZone: ShippingZone = {
            id: `zone_${Date.now()}`,
            name: "New Zone",
            countries: [],
            methods: [],
        }
        setSettings((prev) => ({
            ...prev,
            zones: [...prev.zones, newZone],
        }))
    }

    const updateZone = (zoneId: string, updates: Partial<ShippingZone>) => {
        setSettings((prev) => ({
            ...prev,
            zones: prev.zones.map((zone) => (zone.id === zoneId ? { ...zone, ...updates } : zone)),
        }))
    }

    const deleteZone = (zoneId: string) => {
        setSettings((prev) => ({
            ...prev,
            zones: prev.zones.filter((zone) => zone.id !== zoneId),
        }))
    }

    const addShippingMethod = (zoneId: string) => {
        const newMethod: ShippingMethod = {
            id: `method_${Date.now()}`,
            name: "New Method",
            type: "fixed",
            price: 0,
            estimatedDays: { min: 1, max: 3 },
            enabled: true,
        }

        updateZone(zoneId, {
            methods: [...(settings.zones.find((z) => z.id === zoneId)?.methods || []), newMethod],
        })
    }

    const updateMethod = (zoneId: string, methodId: string, updates: Partial<ShippingMethod>) => {
        const zone = settings.zones.find((z) => z.id === zoneId)
        if (!zone) return

        const updatedMethods = zone.methods.map((method) => (method.id === methodId ? { ...method, ...updates } : method))

        updateZone(zoneId, { methods: updatedMethods })
    }

    const deleteMethod = (zoneId: string, methodId: string) => {
        const zone = settings.zones.find((z) => z.id === zoneId)
        if (!zone) return

        updateZone(zoneId, {
            methods: zone.methods.filter((method) => method.id !== methodId),
        })
    }

    const handleSaveSettings = async () => {
        setSaving(true)
        try {
            const response = await fetch("/api/shipping/settings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(settings),
            })

            const result = await response.json()

            if (result.success) {
                toast({
                    title: "Shipping settings saved!",
                    description: "Your shipping configuration has been updated successfully",
                })
            } else {
                throw new Error(result.error)
            }
        } catch (error) {
            console.error("Error saving shipping settings:", error)
            toast({
                title: "Error",
                description: "Failed to save shipping settings. Please try again.",
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
    }

    if (loading || loadingSettings) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading shipping settings...</p>
                </div>
            </div>
        )
    }

    if (!user || !isAdmin) {
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <Button variant="ghost" size="sm" onClick={() => router.push("/admin")}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Button>
                            <h1 className="text-xl font-light tracking-wide text-gray-900">Shipping Settings</h1>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-6">
                    {/* General Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>General Settings</CardTitle>
                            <CardDescription>Configure basic shipping preferences and units</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <Label htmlFor="currency">Default Currency</Label>
                                    <Select
                                        value={settings.defaultCurrency}
                                        onValueChange={(value) => setSettings((prev) => ({ ...prev, defaultCurrency: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="USD">USD ($)</SelectItem>
                                            <SelectItem value="EUR">EUR (€)</SelectItem>
                                            <SelectItem value="GBP">GBP (£)</SelectItem>
                                            <SelectItem value="CAD">CAD (C$)</SelectItem>
                                            <SelectItem value="AUD">AUD (A$)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="weightUnit">Weight Unit</Label>
                                    <Select
                                        value={settings.weightUnit}
                                        onValueChange={(value: "kg" | "lb") => setSettings((prev) => ({ ...prev, weightUnit: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="kg">Kilograms (kg)</SelectItem>
                                            <SelectItem value="lb">Pounds (lb)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="dimensionUnit">Dimension Unit</Label>
                                    <Select
                                        value={settings.dimensionUnit}
                                        onValueChange={(value: "cm" | "in") => setSettings((prev) => ({ ...prev, dimensionUnit: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cm">Centimeters (cm)</SelectItem>
                                            <SelectItem value="in">Inches (in)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Origin Address */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <MapPin className="h-5 w-5 mr-2" />
                                Origin Address
                            </CardTitle>
                            <CardDescription>Where you ship from - used for distance calculations</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="country">Country</Label>
                                    <Select
                                        value={settings.originAddress.country}
                                        onValueChange={(value) =>
                                            setSettings((prev) => ({
                                                ...prev,
                                                originAddress: { ...prev.originAddress, country: value },
                                            }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select country" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {COUNTRIES.map((country) => (
                                                <SelectItem key={country} value={country}>
                                                    {country}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="state">State/Province</Label>
                                    <Input
                                        value={settings.originAddress.state}
                                        onChange={(e) =>
                                            setSettings((prev) => ({
                                                ...prev,
                                                originAddress: { ...prev.originAddress, state: e.target.value },
                                            }))
                                        }
                                        placeholder="Enter state or province"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        value={settings.originAddress.city}
                                        onChange={(e) =>
                                            setSettings((prev) => ({
                                                ...prev,
                                                originAddress: { ...prev.originAddress, city: e.target.value },
                                            }))
                                        }
                                        placeholder="Enter city"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="postalCode">Postal Code</Label>
                                    <Input
                                        value={settings.originAddress.postalCode}
                                        onChange={(e) =>
                                            setSettings((prev) => ({
                                                ...prev,
                                                originAddress: { ...prev.originAddress, postalCode: e.target.value },
                                            }))
                                        }
                                        placeholder="Enter postal code"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="address">Street Address</Label>
                                <Input
                                    value={settings.originAddress.address}
                                    onChange={(e) =>
                                        setSettings((prev) => ({
                                            ...prev,
                                            originAddress: { ...prev.originAddress, address: e.target.value },
                                        }))
                                    }
                                    placeholder="Enter street address"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Global Shipping Options */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Global Shipping Options</CardTitle>
                            <CardDescription>Settings that apply to all shipping methods</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Free Shipping</Label>
                                    <p className="text-sm text-gray-500">Offer free shipping above a certain order value</p>
                                </div>
                                <Switch
                                    checked={settings.globalSettings.enableFreeShipping}
                                    onCheckedChange={(checked) =>
                                        setSettings((prev) => ({
                                            ...prev,
                                            globalSettings: { ...prev.globalSettings, enableFreeShipping: checked },
                                        }))
                                    }
                                />
                            </div>

                            {settings.globalSettings.enableFreeShipping && (
                                <div>
                                    <Label htmlFor="freeThreshold">Free Shipping Threshold</Label>
                                    <Input
                                        type="number"
                                        value={settings.globalSettings.freeShippingThreshold}
                                        onChange={(e) =>
                                            setSettings((prev) => ({
                                                ...prev,
                                                globalSettings: { ...prev.globalSettings, freeShippingThreshold: Number(e.target.value) },
                                            }))
                                        }
                                        placeholder="100"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Orders above this amount qualify for free shipping</p>
                                </div>
                            )}

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Local Pickup</Label>
                                    <p className="text-sm text-gray-500">Allow customers to pick up orders locally</p>
                                </div>
                                <Switch
                                    checked={settings.globalSettings.enableLocalPickup}
                                    onCheckedChange={(checked) =>
                                        setSettings((prev) => ({
                                            ...prev,
                                            globalSettings: { ...prev.globalSettings, enableLocalPickup: checked },
                                        }))
                                    }
                                />
                            </div>

                            {settings.globalSettings.enableLocalPickup && (
                                <div>
                                    <Label htmlFor="pickupInstructions">Pickup Instructions</Label>
                                    <Textarea
                                        value={settings.globalSettings.localPickupInstructions}
                                        onChange={(e) =>
                                            setSettings((prev) => ({
                                                ...prev,
                                                globalSettings: { ...prev.globalSettings, localPickupInstructions: e.target.value },
                                            }))
                                        }
                                        placeholder="Provide instructions for local pickup..."
                                        rows={3}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Shipping Zones */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Shipping Zones</CardTitle>
                                    <CardDescription>Configure shipping methods for different regions</CardDescription>
                                </div>
                                <Button onClick={addShippingZone} size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Zone
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {settings.zones.map((zone) => (
                                <Card key={zone.id} className="border-l-4 border-l-blue-500">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 mr-4">
                                                <Input
                                                    value={zone.name}
                                                    onChange={(e) => updateZone(zone.id, { name: e.target.value })}
                                                    className="font-medium"
                                                    placeholder="Zone name"
                                                />
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => deleteZone(zone.id)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label>Countries/Regions</Label>
                                            <Select
                                                value=""
                                                onValueChange={(country) => {
                                                    if (!zone.countries.includes(country)) {
                                                        updateZone(zone.id, { countries: [...zone.countries, country] })
                                                    }
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Add countries to this zone" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {COUNTRIES.filter((country) => !zone.countries.includes(country)).map((country) => (
                                                        <SelectItem key={country} value={country}>
                                                            {country}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {zone.countries.map((country) => (
                                                    <span
                                                        key={country}
                                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                                                    >
                            {country}
                                                        <button
                                                            onClick={() =>
                                                                updateZone(zone.id, {
                                                                    countries: zone.countries.filter((c) => c !== country),
                                                                })
                                                            }
                                                            className="ml-1 text-blue-600 hover:text-blue-800"
                                                        >
                              ×
                            </button>
                          </span>
                                                ))}
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label>Shipping Methods</Label>
                                                <Button variant="outline" size="sm" onClick={() => addShippingMethod(zone.id)}>
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Add Method
                                                </Button>
                                            </div>

                                            {zone.methods.map((method) => (
                                                <Card key={method.id} className="bg-gray-50">
                                                    <CardContent className="p-4 space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <Input
                                                                value={method.name}
                                                                onChange={(e) => updateMethod(zone.id, method.id, { name: e.target.value })}
                                                                className="flex-1 mr-4"
                                                                placeholder="Method name"
                                                            />
                                                            <div className="flex items-center space-x-2">
                                                                <Switch
                                                                    checked={method.enabled}
                                                                    onCheckedChange={(checked) => updateMethod(zone.id, method.id, { enabled: checked })}
                                                                />
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => deleteMethod(zone.id, method.id)}
                                                                    className="text-red-600 hover:text-red-700"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <div>
                                                                <Label>Type</Label>
                                                                <Select
                                                                    value={method.type}
                                                                    onValueChange={(value: ShippingMethod["type"]) =>
                                                                        updateMethod(zone.id, method.id, { type: value })
                                                                    }
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="free">Free Shipping</SelectItem>
                                                                        <SelectItem value="fixed">Fixed Rate</SelectItem>
                                                                        <SelectItem value="weight_based">Weight Based</SelectItem>
                                                                        <SelectItem value="calculated">API Calculated</SelectItem>
                                                                        <SelectItem value="distance_based">Distance Based</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            {(method.type === "fixed" || method.type === "weight_based") && (
                                                                <div>
                                                                    <Label>Price ({settings.defaultCurrency})</Label>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={method.price || 0}
                                                                        onChange={(e) =>
                                                                            updateMethod(zone.id, method.id, { price: Number(e.target.value) })
                                                                        }
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                            )}

                                                            {method.type === "free" && (
                                                                <div>
                                                                    <Label>Minimum Order ({settings.defaultCurrency})</Label>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={method.freeThreshold || 0}
                                                                        onChange={(e) =>
                                                                            updateMethod(zone.id, method.id, { freeThreshold: Number(e.target.value) })
                                                                        }
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                            )}

                                                            <div>
                                                                <Label>Estimated Delivery (days)</Label>
                                                                <div className="flex space-x-2">
                                                                    <Input
                                                                        type="number"
                                                                        value={method.estimatedDays?.min || 1}
                                                                        onChange={(e) =>
                                                                            updateMethod(zone.id, method.id, {
                                                                                estimatedDays: {
                                                                                    ...method.estimatedDays,
                                                                                    min: Number(e.target.value),
                                                                                },
                                                                            })
                                                                        }
                                                                        placeholder="Min"
                                                                    />
                                                                    <Input
                                                                        type="number"
                                                                        value={method.estimatedDays?.max || 3}
                                                                        onChange={(e) =>
                                                                            updateMethod(zone.id, method.id, {
                                                                                estimatedDays: {
                                                                                    ...method.estimatedDays,
                                                                                    max: Number(e.target.value),
                                                                                },
                                                                            })
                                                                        }
                                                                        placeholder="Max"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {method.type === "calculated" && (
                                                            <div className="bg-blue-50 p-3 rounded-lg">
                                                                <div className="flex items-center text-blue-800">
                                                                    <Calculator className="h-4 w-4 mr-2" />
                                                                    <span className="text-sm font-medium">API Calculated Shipping</span>
                                                                </div>
                                                                <p className="text-xs text-blue-600 mt-1">
                                                                    Rates will be calculated in real-time using shipping APIs (USPS, UPS, FedEx, etc.)
                                                                </p>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {settings.zones.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>No shipping zones configured yet.</p>
                                    <p className="text-sm">Add a zone to start configuring shipping methods.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <Button onClick={handleSaveSettings} disabled={saving} size="lg">
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Shipping Settings
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
