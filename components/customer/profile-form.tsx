"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"

const profileSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface ProfileFormProps {
    user: any
}

export function ProfileForm({ user }: ProfileFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [userDocId, setUserDocId] = useState<string | null>(null)
    const { toast } = useToast()

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: user?.firstName || "",
            lastName: user?.lastName || "",
            email: user?.email || "",
            phone: user?.phone || "",
        },
    })

    useEffect(() => {
        const fetchUserDocId = async () => {
            if (!user?.uid) return

            try {
                // Query for user document using the uid field (existing structure)
                const userRef = collection(db, "users")
                const q = query(userRef, where("uid", "==", user.uid))
                const querySnapshot = await getDocs(q)

                if (!querySnapshot.empty) {
                    const userDoc = querySnapshot.docs[0]
                    setUserDocId(userDoc.id)

                    // Update form with existing data
                    const userData = userDoc.data()
                    form.reset({
                        firstName: userData.firstName || "",
                        lastName: userData.lastName || "",
                        email: user.email || "",
                        phone: userData.phone || "",
                    })
                }
            } catch (error) {
                console.error("Error fetching user document:", error)
            }
        }

        fetchUserDocId()
    }, [user, form])

    async function onSubmit(data: ProfileFormValues) {
        setIsLoading(true)

        try {
            if (!userDocId) {
                throw new Error("User document not found")
            }

            // Update the existing document using its document ID
            const userDocRef = doc(db, "users", userDocId)
            await updateDoc(userDocRef, {
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone || "",
                updatedAt: new Date(),
            })

            toast({
                title: "Profile updated",
                description: "Your profile information has been updated successfully.",
            })
        } catch (error) {
            console.error("Error updating profile:", error)
            toast({
                title: "Error",
                description: "There was an error updating your profile. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="John" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="john.doe@example.com" {...field} disabled />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                    <Input placeholder="+1 (555) 123-4567" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" disabled={isLoading || !userDocId}>
                    {isLoading ? "Saving..." : "Save Changes"}
                </Button>

                {!userDocId && <p className="text-sm text-red-600">Loading user profile...</p>}
            </form>
        </Form>
    )
}
