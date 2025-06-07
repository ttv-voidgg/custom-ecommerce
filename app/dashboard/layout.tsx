import type React from "react"
import { StoreHeader } from "@/components/store-header"
import { CustomerSidebar } from "@/components/customer/customer-sidebar"
import { MobileNav } from "@/components/customer/mobile-nav"
import { AuthGuard } from "@/components/customer/auth-guard"

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode
}) {
    return (
        <AuthGuard>
            <div className="min-h-screen bg-gray-50">
                <StoreHeader />
                <div className="pt-16 flex">
                    <CustomerSidebar />
                    <main className="flex-1 p-6 md:p-8 lg:p-10">
                        <div className="md:hidden mb-6">
                            <MobileNav />
                        </div>
                        {children}
                    </main>
                </div>
            </div>
        </AuthGuard>
    )
}
