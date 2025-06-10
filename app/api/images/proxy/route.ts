import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const imageUrl = searchParams.get("url")

        if (!imageUrl) {
            return NextResponse.json({ error: "URL parameter is required" }, { status: 400 })
        }

        // Fetch the image
        const response = await fetch(imageUrl, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
        })

        if (!response.ok) {
            return NextResponse.json({ error: "Failed to fetch image" }, { status: response.status })
        }

        const contentType = response.headers.get("content-type") || "image/jpeg"
        const imageBuffer = await response.arrayBuffer()

        return new NextResponse(imageBuffer, {
            headers: {
                "Content-Type": contentType,
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=31536000",
            },
        })
    } catch (error) {
        console.error("Proxy error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
