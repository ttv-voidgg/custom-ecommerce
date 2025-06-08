"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Save, Loader2, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

interface StoreSettings {
    name: string
    description: string
    currency: string
    logoUrl: string
    bannerImage: string
    shortTagline: string
    buttonText: string
}

export default function AdminSettingsPage() {
    const { user, isAdmin, loading } = useAuth()
    const router = useRouter()
    const { toast } = useToast()

    const [settings, setSettings] = useState<StoreSettings>({
        name: "",
        description: "",
        currency: "USD",
        logoUrl: "",
        bannerImage: "",
        shortTagline: "",
        buttonText: "",
    })
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadingBanner, setUploadingBanner] = useState(false)
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
            const { db } = await import("@/lib/firebase")
            const { doc, getDoc } = await import("firebase/firestore")

            const storeDoc = await getDoc(doc(db, "settings", "store"))
            if (storeDoc.exists()) {
                const data = storeDoc.data()
                setSettings({
                    name: data.name || "",
                    description: data.description || "",
                    currency: data.currency || "USD",
                    logoUrl: data.logoUrl || "",
                    bannerImage: data.bannerImage || "",
                    shortTagline: data.shortTagline || "",
                    buttonText: data.buttonText || "",
                })
            }
        } catch (error) {
            console.error("Error loading settings:", error)
            toast({
                title: "Error",
                description: "Failed to load store settings",
                variant: "destructive",
            })
        } finally {
            setLoadingSettings(false)
        }
    }

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("path", "/logos")

            const response = await fetch("/api/files", {
                method: "POST",
                body: formData,
            })

            if (response.ok) {
                const result = await response.json()
                setSettings((prev) => ({ ...prev, logoUrl: result.url }))
                toast({
                    title: "Logo uploaded!",
                    description: "Your store logo has been uploaded successfully",
                })
            } else {
                throw new Error("Upload failed")
            }
        } catch (error) {
            toast({
                title: "Upload failed",
                description: "Failed to upload logo. Please try again.",
                variant: "destructive",
            })
        } finally {
            setUploading(false)
        }
    }

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingBanner(true)
        try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("path", "/banners")

            const response = await fetch("/api/files", {
                method: "POST",
                body: formData,
            })

            if (response.ok) {
                const result = await response.json()
                setSettings((prev) => ({ ...prev, bannerImage: result.url }))
                toast({
                    title: "Banner uploaded!",
                    description: "Your hero banner has been uploaded successfully",
                })
            } else {
                throw new Error("Upload failed")
            }
        } catch (error) {
            toast({
                title: "Upload failed",
                description: "Failed to upload banner. Please try again.",
                variant: "destructive",
            })
        } finally {
            setUploadingBanner(false)
        }
    }

    const handleRemoveLogo = async () => {
        try {
            setSettings((prev) => ({ ...prev, logoUrl: "" }))
            toast({
                title: "Logo removed!",
                description: "Your store logo has been removed successfully",
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to remove logo. Please try again.",
                variant: "destructive",
            })
        }
    }

    const handleRemoveBanner = async () => {
        try {
            setSettings((prev) => ({ ...prev, bannerImage: "" }))
            toast({
                title: "Banner removed!",
                description: "Your hero banner has been removed successfully",
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to remove banner. Please try again.",
                variant: "destructive",
            })
        }
    }

    const handleSaveSettings = async () => {
        setSaving(true)
        try {
            const { db } = await import("@/lib/firebase")
            const { doc, updateDoc, Timestamp } = await import("firebase/firestore")

            await updateDoc(doc(db, "settings", "store"), {
                name: settings.name,
                description: settings.description,
                currency: settings.currency,
                logoUrl: settings.logoUrl,
                bannerImage: settings.bannerImage,
                shortTagline: settings.shortTagline,
                buttonText: settings.buttonText,
                updatedAt: Timestamp.now(),
            })

            toast({
                title: "Settings saved!",
                description: "Your store settings have been updated successfully",
            })
        } catch (error) {
            console.error("Error saving settings:", error)
            toast({
                title: "Error",
                description: "Failed to save settings. Please try again.",
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
                    <p className="mt-4 text-gray-600">Loading settings...</p>
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
                            <h1 className="text-xl font-light tracking-wide text-gray-900">Store Settings</h1>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-6">
                    {/* Store Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Store Information</CardTitle>
                            <CardDescription>Update your store's basic information and branding</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="storeName">Store Name</Label>
                                    <Input
                                        id="storeName"
                                        value={settings.name}
                                        onChange={(e) => setSettings((prev) => ({ ...prev, name: e.target.value }))}
                                        placeholder="Enter your store name"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="currency">Currency</Label>
                                    <Input
                                        id="currency"
                                        value={settings.currency}
                                        onChange={(e) => setSettings((prev) => ({ ...prev, currency: e.target.value }))}
                                        placeholder="USD"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="storeDescription">Store Description</Label>
                                <Textarea
                                    id="storeDescription"
                                    value={settings.description}
                                    onChange={(e) => setSettings((prev) => ({ ...prev, description: e.target.value }))}
                                    placeholder="Describe your jewelry store"
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Hero Section Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Hero Section</CardTitle>
                            <CardDescription>Customize your homepage hero section content</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="shortTagline">Short Tagline</Label>
                                    <Input
                                        id="shortTagline"
                                        value={settings.shortTagline}
                                        onChange={(e) => setSettings((prev) => ({ ...prev, shortTagline: e.target.value }))}
                                        placeholder="e.g., Timeless Elegance"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Appears below your store name on the homepage</p>
                                </div>

                                <div>
                                    <Label htmlFor="buttonText">Button Text</Label>
                                    <Input
                                        id="buttonText"
                                        value={settings.buttonText}
                                        onChange={(e) => setSettings((prev) => ({ ...prev, buttonText: e.target.value }))}
                                        placeholder="e.g., DISCOVER"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Text for the main call-to-action button</p>
                                </div>
                            </div>

                            {/* Hero Banner Image */}
                            <div>
                                <Label htmlFor="bannerImage">Hero Banner Image</Label>
                                <div className="mt-2">
                                    <div className="flex items-center justify-center w-full">
                                        <label
                                            htmlFor="bannerImage"
                                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                                        >
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="w-8 h-8 mb-4 text-gray-500" />
                                                <p className="mb-2 text-sm text-gray-500">
                                                    <span className="font-semibold">Click to upload</span> hero banner
                                                </p>
                                                <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 5MB)</p>
                                                <p className="text-xs text-gray-500">Recommended: 1920x1080px</p>
                                            </div>
                                            <input
                                                id="bannerImage"
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleBannerUpload}
                                                disabled={uploadingBanner}
                                            />
                                        </label>
                                    </div>
                                    {uploadingBanner && (
                                        <div className="flex items-center mt-2 text-sm text-gray-600">
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Uploading banner...
                                        </div>
                                    )}
                                </div>

                                {settings.bannerImage && (
                                    <div className="mt-4">
                                        <Label>Current Hero Banner</Label>
                                        <div className="mt-2 relative">
                                            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                                                <Image
                                                    src={settings.bannerImage || "/placeholder.svg"}
                                                    alt="Hero banner"
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleRemoveBanner}
                                                className="mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                Remove Banner
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Logo Management */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Store Logo</CardTitle>
                            <CardDescription>Upload and manage your store logo</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-start space-x-6">
                                <div className="flex-1">
                                    <Label htmlFor="logo">Upload New Logo</Label>
                                    <Input
                                        id="logo"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        disabled={uploading}
                                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Recommended: PNG, JPG, or SVG format. Max size: 2MB</p>
                                    {uploading && (
                                        <div className="flex items-center mt-2 text-sm text-gray-600">
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Uploading logo...
                                        </div>
                                    )}
                                </div>

                                {settings.logoUrl && (
                                    <div className="flex-shrink-0">
                                        <Label>Current Logo</Label>
                                        <div className="mt-1 p-4 border rounded-lg bg-white">
                                            <Image
                                                src={settings.logoUrl || "/placeholder.svg"}
                                                alt="Store logo"
                                                width={120}
                                                height={80}
                                                className="max-h-20 w-auto object-contain"
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleRemoveLogo}
                                                className="mt-2 w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                Remove Logo
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {settings.logoUrl && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <Label>Logo URL</Label>
                                    <Input value={settings.logoUrl} readOnly className="mt-1 bg-white" />
                                    <p className="text-xs text-gray-500 mt-1">
                                        This URL can be used to reference your logo in custom templates
                                    </p>
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
                                    Save Settings
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
