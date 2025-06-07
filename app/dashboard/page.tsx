"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { auth, db } from "@/lib/firebase"
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Spinner } from "@/components/ui/spinner"

export default function DashboardPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [userDocId, setUserDocId] = useState<string | null>(null)
    const [profile, setProfile] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
    })

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const user = auth.currentUser
                if (!user) return

                // Query for user document using the uid field (existing structure)
                const userRef = collection(db, "users")
                const q = query(userRef, where("uid", "==", user.uid))
                const querySnapshot = await getDocs(q)

                if (!querySnapshot.empty) {
                    // Get the first (and should be only) document
                    const userDoc = querySnapshot.docs[0]
                    const userData = userDoc.data()

                    // Store the document ID for updates
                    setUserDocId(userDoc.id)

                    setProfile({
                        firstName: userData.firstName || "",
                        lastName: userData.lastName || "",
                        email: user.email || "",
                        phone: userData.phone || "",
                    })
                } else {
                    // User document doesn't exist in Firestore yet
                    console.log("User document not found in Firestore")
                    setProfile({
                        firstName: "",
                        lastName: "",
                        email: user.email || "",
                        phone: "",
                    })
                }
            } catch (error) {
                console.error("Error fetching profile:", error)
                toast({
                    title: "Error",
                    description: "Failed to load profile information",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setProfile((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const user = auth.currentUser
            if (!user) throw new Error("User not authenticated")

            if (!userDocId) {
                throw new Error("User document not found. Please contact support.")
            }

            // Update the existing document using its document ID
            const userDocRef = doc(db, "users", userDocId)
            await updateDoc(userDocRef, {
                firstName: profile.firstName,
                lastName: profile.lastName,
                phone: profile.phone,
                updatedAt: new Date(),
            })

            toast({
                title: "Profile Updated",
                description: "Your profile information has been saved.",
            })
        } catch (error) {
            console.error("Error saving profile:", error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to save profile information",
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
                <p className="text-muted-foreground">Manage your personal information</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First name</Label>
                                <Input id="firstName" name="firstName" value={profile.firstName} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last name</Label>
                                <Input id="lastName" name="lastName" value={profile.lastName} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" value={profile.email} disabled />
                            <p className="text-sm text-muted-foreground">Email cannot be changed</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone number</Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={profile.phone}
                                onChange={handleChange}
                                placeholder="(123) 456-7890"
                            />
                        </div>

                        <Button type="submit" disabled={saving || !userDocId}>
                            {saving ? (
                                <>
                                    <Spinner size="sm" className="mr-2" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>

                        {!userDocId && (
                            <p className="text-sm text-red-600">
                                User profile not found. Please contact support if this issue persists.
                            </p>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
