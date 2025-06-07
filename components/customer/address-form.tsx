"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"

const addressSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    address1: z.string().min(1, "Address is required"),
    address2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State/Province is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().min(1, "Country is required"),
    phone: z.string().optional(),
    isDefault: z.boolean().default(false),
})

type AddressFormValues = z.infer<typeof addressSchema>

interface AddressFormProps {
    userId: string
    existingAddress?: any
    onSuccess?: () => void
    isDefault?: boolean
}

export function AddressForm({ userId, existingAddress, onSuccess, isDefault = false }: AddressFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    const form = useForm<AddressFormValues>({
        resolver: zodResolver(addressSchema),
        defaultValues: {
            firstName: existingAddress?.firstName || "",
            lastName: existingAddress?.lastName || "",
            address1: existingAddress?.address1 || "",
            address2: existingAddress?.address2 || "",
            city: existingAddress?.city || "",
            state: existingAddress?.state || "",
            postalCode: existingAddress?.postalCode || "",
            country: existingAddress?.country || "United States",
            phone: existingAddress?.phone || "",
            isDefault: existingAddress?.isDefault || isDefault,
        },
    })

    async function onSubmit(data: AddressFormValues) {
        if (!userId) {
            toast({
                title: "Error",
                description: "User not authenticated",
                variant: "destructive",
            })
            return
        }

        setIsLoading(true)

        try {
            console.log("Submitting address data:", data)

            const { db } = await import("@/lib/firebase")
            const { collection, addDoc, doc, updateDoc, query, where, getDocs, writeBatch, Timestamp } = await import(
                "firebase/firestore"
                )

            if (!db) {
                throw new Error("Database not initialized")
            }

            // If this is set as default, we need to update all other addresses
            if (data.isDefault) {
                const batch = writeBatch(db)

                // Get all addresses for this user
                const addressesRef = collection(db, "addresses")
                const q = query(addressesRef, where("userId", "==", userId))
                const querySnapshot = await getDocs(q)

                // Set all addresses to non-default
                querySnapshot.forEach((document) => {
                    batch.update(doc(db, "addresses", document.id), { isDefault: false })
                })

                await batch.commit()
            }

            if (existingAddress) {
                // Update existing address
                console.log("Updating existing address:", existingAddress.id)
                await updateDoc(doc(db, "addresses", existingAddress.id), {
                    ...data,
                    userId,
                    updatedAt: Timestamp.now(),
                })

                toast({
                    title: "Address updated",
                    description: "Your address has been updated successfully.",
                })
            } else {
                // Add new address
                console.log("Adding new address for user:", userId)
                const docRef = await addDoc(collection(db, "addresses"), {
                    ...data,
                    userId,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                })

                console.log("Address added with ID:", docRef.id)

                toast({
                    title: "Address added",
                    description: "Your new address has been saved.",
                })
            }

            if (onSuccess) {
                onSuccess()
            }
        } catch (error) {
            console.error("Error saving address:", error)
            toast({
                title: "Error",
                description: "There was an error saving your address. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                <FormField
                    control={form.control}
                    name="address1"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Address Line 1</FormLabel>
                            <FormControl>
                                <Input placeholder="123 Main St" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="address2"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Address Line 2 (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="Apt 4B" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                    <Input placeholder="New York" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>State/Province</FormLabel>
                                <FormControl>
                                    <Input placeholder="NY" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="postalCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Postal Code</FormLabel>
                                <FormControl>
                                    <Input placeholder="10001" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Country</FormLabel>
                                <FormControl>
                                    <Input placeholder="United States" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Phone Number (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="+1 (555) 123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="isDefault"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>Set as default address</FormLabel>
                                <p className="text-sm text-gray-500">This address will be used as your default shipping address.</p>
                            </div>
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Saving..." : existingAddress ? "Update Address" : "Add Address"}
                </Button>
            </form>
        </Form>
    )
}
