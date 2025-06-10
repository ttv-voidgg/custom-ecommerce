import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get("url") || ""

    // Test URL normalization
    const normalizedUrl = normalizeUrl(url)

    // Check if the URL is accessible
    let accessResult = "Not tested"
    if (url) {
        try {
            const response = await fetch(normalizedUrl, { method: "HEAD" })
            accessResult = response.ok ? "Accessible" : `Error: ${response.status} ${response.statusText}`
        } catch (error: any) {
            accessResult = `Error: ${error.message}`
        }
    }

    return NextResponse.json({
        originalUrl: url,
        normalizedUrl,
        analysis: {
            hasProtocol: url.startsWith("http://") || url.startsWith("https://"),
            malformedProtocol:
                (url.startsWith("https:/") && !url.startsWith("https://")) ||
                (url.startsWith("http:/") && !url.startsWith("http://")),
            urlStructure: parseUrl(url),
            accessResult,
        },
        sftp: {
            baseUrl: process.env.SFTP_BASE_URL,
            baseUrlNormalized: normalizeUrl(process.env.SFTP_BASE_URL || ""),
        },
    })
}

function normalizeUrl(url: string): string {
    if (!url) return url

    // Fix malformed protocols
    if (url.startsWith("https:/") && !url.startsWith("https://")) {
        return url.replace("https:/", "https://")
    }

    if (url.startsWith("http:/") && !url.startsWith("http://")) {
        return url.replace("http:/", "http://")
    }

    return url
}

function parseUrl(url: string) {
    try {
        // Add protocol if missing for parsing
        const urlToParse = url.startsWith("http") ? url : `https://${url}`
        const parsed = new URL(urlToParse)
        return {
            protocol: parsed.protocol,
            host: parsed.host,
            pathname: parsed.pathname,
            valid: true,
        }
    } catch (error) {
        return {
            valid: false,
            error: "Invalid URL",
        }
    }
}
