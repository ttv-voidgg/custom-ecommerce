import { getServerSession } from "@/lib/auth"
import { OrdersList } from "@/components/customer/orders-list"

export default async function OrdersPage() {
    const user = await getServerSession()

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight">My Orders</h1>
                <p className="text-sm text-gray-500 mt-1">View and track your order history</p>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <OrdersList userId={user?.uid} />
            </div>
        </div>
    )
}
