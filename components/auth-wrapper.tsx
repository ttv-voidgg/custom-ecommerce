"use client"

import type React from "react"

import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

interface AuthWrapperProps {
    children: React.ReactNode
    fallback?: React.ReactNode
    requireAuth?: boolean
    requireAdmin?: boolean
}

export function AuthWrapper({ children, fallback, requireAuth = false, requireAdmin = false }: AuthWrapperProps) {
    const { user, isAdmin, loading } = useAuth()

    if (loading) {
        return (
            fallback || (
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            )
        )
    }

    if (requireAuth && !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
                    <p className="text-gray-600">Please sign in to access this page.</p>
                </div>
            </div>
        )
    }

    if (requireAdmin && !isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
                    <p className="text-gray-600">You don't have permission to access this page.</p>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
