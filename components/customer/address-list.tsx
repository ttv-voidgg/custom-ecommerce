"use client"

import { useState, useEffect } from "react"
import { Plus, MapPin, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AddressForm } from "@/components/customer/address-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"

interface Address {
    id: string
    firstName: string
    lastName: string
    address1: string
    address2?: string
    city: string
    state: string
    postalCode: string
    country: string
    phone?: string
    isDefault: boolean
}

interface AddressListProps {
    userId?: string
}

export function AddressList({ userId }: AddressListProps) {
    const [addresses, setAddresses] = useState<Address[]>([])
    const [loading, setLoading] = useState(true)
    const [editingAddress, setEditingAddress] = useState<Address | null>(null)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        if (userId) {
            fetchAddresses()
        } else {
            setLoading(false)
        }
    }, [userId])

    async function fetchAddresses() {
        if (!userId) {
            setLoading(false)
            return
        }

        setLoading(true)
        try {
            console.log("Fetching addresses for user:", userId)

            const { db } = await import("@/lib/firebase")
            const { collection, query, where, getDocs } = await import("firebase/firestore")

            if (!db) {
                console.error("Database not initialized")
                setLoading(false)
                return
            }

            const addressesRef = collection(db, "addresses")
            const q = query(addressesRef, where("userId", "==", userId))
            const querySnapshot = await getDocs(q)

            console.log("Found addresses:", querySnapshot.size)

            const addressesData = querySnapshot.docs.map((doc) => {
                const data = doc.data()
                console.log("Address data:", data)
                return {
                    id: doc.id,
                    ...data,
                }
            }) as Address[]

            setAddresses(addressesData)
        } catch (error) {
            console.error("Error fetching addresses:", error)
            toast({
                title: "Error",
                description: "Failed to load addresses. Please try again.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    async function handleSetDefault(addressId: string) {
        if (!userId) return

        try {
            const { db } = await import("@/lib/firebase")
            const { collection, query, where, getDocs, writeBatch, doc } = await import("firebase/firestore")

            const batch = writeBatch(db)

            // Get all addresses for this user
            const addressesRef = collection(db, "addresses")
            const q = query(addressesRef, where("userId", "==", userId))
            const querySnapshot = await getDocs(q)

            // Set all addresses to non-default
            querySnapshot.forEach((document) => {
                batch.update(doc(db, "addresses", document.id), { isDefault: false })
            })

            // Set the selected address as default
            batch.update(doc(db, "addresses", addressId), { isDefault: true })

            await batch.commit()

            // Update local state
            setAddresses((prev) =>
                prev.map((address) => ({
                    ...address,
                    isDefault: address.id === addressId,
                })),
            )

            toast({
                title: "Default address updated",
                description: "Your default shipping address has been updated.",
            })
        } catch (error) {
            console.error("Error setting default address:", error)
            toast({
                title: "Error",
                description: "Failed to update default address",
                variant: "destructive",
            })
        }
    }

    async function handleDeleteAddress(addressId: string) {
        try {
            const { db } = await import("@/lib/firebase")
            const { doc, deleteDoc, getDoc } = await import("firebase/firestore")

            // Check if this is the default address
            const addressRef = doc(db, "addresses", addressId)
            const addressSnap = await getDoc(addressRef)

            if (addressSnap.exists() && addressSnap.data().isDefault) {
                toast({
                    title: "Cannot delete default address",
                    description: "Please set another address as default before deleting this one.",
                    variant: "destructive",
                })
                return
            }

            await deleteDoc(addressRef)

            // Update local state
            setAddresses((prev) => prev.filter((address) => address.id !== addressId))

            toast({
                title: "Address deleted",
                description: "The address has been removed from your account.",
            })
        } catch (error) {
            console.error("Error deleting address:", error)
            toast({
                title: "Error",
                description: "Failed to delete address",
                variant: "destructive",
            })
        }
    }

    function handleEditAddress(address: Address) {
        setEditingAddress(address)
        setIsEditDialogOpen(true)
    }

    // Show loading state
    if (loading) {
        return (
            <div className="p-6 grid gap-4 md:grid-cols-2">
                {[...Array(2)].map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-[250px]" />
                                <Skeleton className="h-4 w-[200px]" />
                                <Skeleton className="h-4 w-[150px]" />
                                <div className="pt-2">
                                    <Skeleton className="h-8 w-[100px]" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    // Show message if no userId
    if (!userId) {
        return (
            <div className="p-6 text-center">
                <p className="text-gray-500">Please sign in to manage your addresses.</p>
            </div>
        )
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Saved Addresses</h3>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add New Address
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[550px]">
                        <DialogHeader>
                            <DialogTitle>Add New Address</DialogTitle>
                        </DialogHeader>
                        <AddressForm
                            userId={userId}
                            onSuccess={() => {
                                fetchAddresses()
                                setIsAddDialogOpen(false)
                            }}
                            isDefault={addresses.length === 0}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {addresses.length === 0 ? (
                <div className="text-center py-12">
                    <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <MapPin className="h-6 w-6 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No addresses saved</h3>
                    <p className="mt-1 text-sm text-gray-500">Add a shipping address to make checkout faster.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {addresses.map((address) => (
                        <Card key={address.id}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {address.firstName} {address.lastName}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">{address.address1}</p>
                                        {address.address2 && <p className="text-sm text-gray-500">{address.address2}</p>}
                                        <p className="text-sm text-gray-500">
                                            {address.city}, {address.state} {address.postalCode}
                                        </p>
                                        <p className="text-sm text-gray-500">{address.country}</p>
                                        {address.phone && <p className="text-sm text-gray-500 mt-1">Phone: {address.phone}</p>}
                                    </div>
                                    {address.isDefault && (
                                        <Badge variant="outline" className="bg-gray-100">
                                            Default
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex space-x-2 mt-4">
                                    <Button variant="outline" size="sm" onClick={() => handleEditAddress(address)}>
                                        <Pencil className="mr-2 h-3 w-3" />
                                        Edit
                                    </Button>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <Trash2 className="mr-2 h-3 w-3" />
                                                Delete
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Address</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to delete this address? This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDeleteAddress(address.id)}
                                                    className="bg-red-600 hover:bg-red-700"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>

                                    {!address.isDefault && (
                                        <Button variant="ghost" size="sm" onClick={() => handleSetDefault(address.id)}>
                                            Set as Default
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit Address Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle>Edit Address</DialogTitle>
                    </DialogHeader>
                    {editingAddress && (
                        <AddressForm
                            userId={userId}
                            existingAddress={editingAddress}
                            onSuccess={() => {
                                fetchAddresses()
                                setIsEditDialogOpen(false)
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
