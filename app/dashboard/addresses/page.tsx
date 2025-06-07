"use client"

import { useState, useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { AddressList } from "@/components/customer/address-list"
import { Spinner } from "@/components/ui/spinner"

export default function AddressesPage() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            console.log("Auth state changed:", firebaseUser?.uid)
            setUser(firebaseUser)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold tracking-tight mb-4">My Addresses</h1>
                    <p className="text-gray-500">Please sign in to manage your addresses.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight">My Addresses</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your shipping and billing addresses</p>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <AddressList userId={user.uid} />
            </div>
        </div>
    )
}
