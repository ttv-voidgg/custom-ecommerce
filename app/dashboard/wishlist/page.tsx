import { getServerSession } from "@/lib/auth"
import { WishlistItems } from "@/components/customer/wishlist-items"

export default async function WishlistPage() {
    const user = await getServerSession()

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight">My Wishlist</h1>
                <p className="text-sm text-gray-500 mt-1">Items you've saved for later</p>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <WishlistItems userId={user?.uid} />
            </div>
        </div>
    )
}
