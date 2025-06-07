import Link from "next/link"
import { notFound } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import { OrderDetail } from "@/components/customer/order-detail"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

interface OrderDetailPageProps {
    params: {
        id: string
    }
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
    const user = await getServerSession()

    if (!user) {
        notFound()
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <Link href="/dashboard/orders">
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back to Orders
                    </Button>
                </Link>
                <h1 className="text-2xl font-semibold tracking-tight">Order Details</h1>
                <p className="text-sm text-gray-500 mt-1">View the details of your order</p>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <OrderDetail orderId={params.id} userId={user.uid} />
            </div>
        </div>
    )
}
