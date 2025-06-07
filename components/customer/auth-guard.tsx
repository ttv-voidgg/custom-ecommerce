"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Spinner } from "@/components/ui/spinner"

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true)
    const [authenticated, setAuthenticated] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setAuthenticated(true)
            } else {
                router.push("/auth?redirect=/dashboard")
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [router])

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Spinner size="lg" />
            </div>
        )
    }

    if (!authenticated) {
        return null
    }

    return <>{children}</>
}
