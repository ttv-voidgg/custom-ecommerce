"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Save, Loader2 } from "lucide-react"

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
    })
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
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
