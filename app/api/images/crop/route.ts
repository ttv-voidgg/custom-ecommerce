import { type NextRequest, NextResponse } from "next/server"
import Client from "ssh2-sftp-client"
import sharp from "sharp"

interface CropData {
    x: number
    y: number
    width: number
    height: number
    originalWidth: number
    originalHeight: number
    targetWidth: number
    targetHeight: number
}

export async function GET(request: NextRequest) {
    const startTime = Date.now()
    let step = "initialization"

    try {
        console.log("=== CROP API REQUEST START ===")
        console.log("Request URL:", request.url)

        const { searchParams } = new URL(request.url)
        const cropUrl = searchParams.get("url")

        console.log("Crop URL parameter:", cropUrl)

        if (!cropUrl) {
            console.error("ERROR: Missing crop URL parameter")
            return NextResponse.json(
                {
                    error: "Missing crop URL parameter",
                    step: "validation",
                    received: { cropUrl },
                },
                { status: 400 },
            )
        }

        step = "parsing_crop_url"
        console.log("Step: Parsing crop URL...")

        // Parse the crop URL
        const [originalUrl, cropHash] = cropUrl.split("#crop=")
        console.log("Original URL:", originalUrl)
        console.log("Crop hash:", cropHash)

        if (!cropHash) {
            console.error("ERROR: Invalid crop URL format - no crop hash found")
            return NextResponse.json(
                {
                    error: "Invalid crop URL format - missing crop data",
                    step: "parsing_crop_url",
                    received: { originalUrl, cropHash },
                    expected: "URL format: originalUrl#crop=encodedCropData",
                },
                { status: 400 },
            )
        }

        step = "parsing_crop_data"
        console.log("Step: Parsing crop data...")

        let cropData: CropData
        try {
            const decodedCropHash = decodeURIComponent(cropHash)
            console.log("Decoded crop hash:", decodedCropHash)
            cropData = JSON.parse(decodedCropHash)
            console.log("Parsed crop data:", cropData)
        } catch (parseError) {
            console.error("ERROR: Failed to parse crop data:", parseError)
            return NextResponse.json(
                {
                    error: "Invalid crop data format",
                    step: "parsing_crop_data",
                    details: parseError instanceof Error ? parseError.message : String(parseError),
                    received: { cropHash },
                },
                { status: 400 },
            )
        }

        // Validate crop data
        const requiredFields = [
            "x",
            "y",
            "width",
            "height",
            "originalWidth",
            "originalHeight",
            "targetWidth",
            "targetHeight",
        ]
        const missingFields = requiredFields.filter((field) => !(field in cropData))
        if (missingFields.length > 0) {
            console.error("ERROR: Missing required crop data fields:", missingFields)
            return NextResponse.json(
                {
                    error: "Missing required crop data fields",
                    step: "validating_crop_data",
                    missingFields,
                    received: cropData,
                },
                { status: 400 },
            )
        }

        step = "extracting_file_path"
        console.log("Step: Extracting file path...")

        // Extract file path from original URL
        let filePath = originalUrl
        console.log("Initial file path:", filePath)

        if (originalUrl.includes("/assets/")) {
            const pathMatch = originalUrl.match(/\/assets\/(.+)$/)
            if (pathMatch) {
                filePath = `/assets/${pathMatch[1]}`
                console.log("Extracted assets path:", filePath)
            }
        } else if (originalUrl.startsWith("http")) {
            try {
                const urlObj = new URL(originalUrl)
                filePath = urlObj.pathname
                console.log("Extracted pathname from URL:", filePath)
            } catch (urlError) {
                console.error("ERROR: Could not parse URL:", urlError)
                return NextResponse.json(
                    {
                        error: "Invalid original URL format",
                        step: "extracting_file_path",
                        details: urlError instanceof Error ? urlError.message : String(urlError),
                        received: { originalUrl },
                    },
                    { status: 400 },
                )
            }
        }

        console.log("Final file path:", filePath)

        step = "sftp_connection"
        console.log("Step: Connecting to SFTP...")

        // Validate SFTP environment variables
        const sftpConfig = {
            host: process.env.SFTP_HOST,
            port: Number.parseInt(process.env.SFTP_PORT || "22"),
            username: process.env.SFTP_USERNAME,
            password: process.env.SFTP_PASSWORD,
        }

        console.log("SFTP config:", {
            host: sftpConfig.host,
            port: sftpConfig.port,
            username: sftpConfig.username,
            password: sftpConfig.password ? "[REDACTED]" : undefined,
        })

        if (!sftpConfig.host || !sftpConfig.username || !sftpConfig.password) {
            console.error("ERROR: Missing SFTP configuration")
            return NextResponse.json(
                {
                    error: "Server configuration error - missing SFTP credentials",
                    step: "sftp_connection",
                    missing: {
                        host: !sftpConfig.host,
                        username: !sftpConfig.username,
                        password: !sftpConfig.password,
                    },
                },
                { status: 500 },
            )
        }

        // Connect to SFTP and fetch the original image
        const sftp = new Client()
        let imageBuffer: Buffer

        try {
            console.log("Connecting to SFTP server...")
            await sftp.connect(sftpConfig)
            console.log("SFTP connected successfully")

            step = "sftp_file_fetch"
            console.log("Step: Fetching file from SFTP...")
            console.log("Fetching file:", filePath)

            const fetchedData = await sftp.get(filePath)
            console.log("File fetched, type:", typeof fetchedData)
            console.log("Is Buffer:", Buffer.isBuffer(fetchedData))

            if (!Buffer.isBuffer(fetchedData)) {
                throw new Error(`Expected Buffer, got ${typeof fetchedData}`)
            }

            imageBuffer = fetchedData
            console.log("Image buffer size:", imageBuffer.length, "bytes")
        } catch (sftpError) {
            console.error("ERROR: SFTP operation failed:", sftpError)

            // Try to close connection if it was opened
            try {
                await sftp.end()
            } catch (closeError) {
                console.error("Error closing SFTP connection:", closeError)
            }

            return NextResponse.json(
                {
                    error: "Failed to fetch image from SFTP",
                    step,
                    details: sftpError instanceof Error ? sftpError.message : String(sftpError),
                    sftpConfig: {
                        host: sftpConfig.host,
                        port: sftpConfig.port,
                        username: sftpConfig.username,
                    },
                    filePath,
                },
                { status: 500 },
            )
        }

        // Close SFTP connection
        try {
            await sftp.end()
            console.log("SFTP connection closed")
        } catch (closeError) {
            console.error("Warning: Error closing SFTP connection:", closeError)
        }

        step = "image_processing"
        console.log("Step: Processing image with Sharp...")
        console.log("Crop parameters:", {
            left: Math.round(cropData.x),
            top: Math.round(cropData.y),
            width: Math.round(cropData.width),
            height: Math.round(cropData.height),
        })
        console.log("Resize parameters:", {
            width: cropData.targetWidth,
            height: cropData.targetHeight,
        })

        let croppedBuffer: Buffer

        try {
            // Get image metadata first
            const metadata = await sharp(imageBuffer).metadata()
            console.log("Image metadata:", {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                size: metadata.size,
            })

            // Validate crop coordinates
            if (
                cropData.x < 0 ||
                cropData.y < 0 ||
                cropData.x + cropData.width > (metadata.width || 0) ||
                cropData.y + cropData.height > (metadata.height || 0)
            ) {
                throw new Error(
                    `Crop coordinates out of bounds. Image: ${metadata.width}x${metadata.height}, Crop: ${cropData.x},${cropData.y} ${cropData.width}x${cropData.height}`,
                )
            }

            // Crop the image using Sharp
            croppedBuffer = await sharp(imageBuffer)
                .extract({
                    left: Math.round(cropData.x),
                    top: Math.round(cropData.y),
                    width: Math.round(cropData.width),
                    height: Math.round(cropData.height),
                })
                .resize(cropData.targetWidth, cropData.targetHeight, {
                    fit: "cover",
                    position: "center",
                })
                .jpeg({ quality: 90 })
                .toBuffer()

            console.log("Image processed successfully, output size:", croppedBuffer.length, "bytes")
        } catch (sharpError) {
            console.error("ERROR: Sharp processing failed:", sharpError)
            return NextResponse.json(
                {
                    error: "Failed to process image",
                    step: "image_processing",
                    details: sharpError instanceof Error ? sharpError.message : String(sharpError),
                    cropData,
                    imageSize: imageBuffer.length,
                },
                { status: 500 },
            )
        }

        const processingTime = Date.now() - startTime
        console.log(`=== CROP API SUCCESS (${processingTime}ms) ===`)

        // Return the cropped image
        return new NextResponse(croppedBuffer, {
            headers: {
                "Content-Type": "image/jpeg",
                "Cache-Control": "public, max-age=31536000", // 1 year cache
                "Access-Control-Allow-Origin": "*",
                "X-Processing-Time": `${processingTime}ms`,
                "X-Image-Size": `${croppedBuffer.length}`,
            },
        })
    } catch (error: any) {
        const processingTime = Date.now() - startTime
        console.error(`=== CROP API ERROR at step '${step}' (${processingTime}ms) ===`)
        console.error("Error details:", error)
        console.error("Error stack:", error.stack)

        return NextResponse.json(
            {
                error: "Internal server error during image cropping",
                step,
                details: error.message || String(error),
                stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
                processingTime: `${processingTime}ms`,
            },
            { status: 500 },
        )
    }
}
