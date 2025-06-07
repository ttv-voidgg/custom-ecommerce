// Update the local file upload route to ensure it returns consistent responses
import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

// This is a fallback API route that stores files locally when SFTP is not available
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get("file") as File
        const uploadPath = (formData.get("path") as string) || "/"

        if (!file) {
            return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
        }

        // Create a unique filename to avoid collisions
        const fileName = `${Date.now()}-${file.name}`

        // Convert the file to a Buffer
        const buffer = Buffer.from(await file.arrayBuffer())

        // Create the directory path
        const publicDir = path.join(process.cwd(), "public")
        const uploadsDir = path.join(publicDir, "uploads")
        const targetDir = path.join(uploadsDir, uploadPath.replace(/^\//, ""))

        // Ensure the directory exists
        await mkdir(targetDir, { recursive: true })

        // Write the file
        const filePath = path.join(targetDir, fileName)
        await writeFile(filePath, buffer)

        // Generate the public URL
        const publicPath = `/uploads${uploadPath}/${fileName}`.replace(/\/\//g, "/")

        return NextResponse.json({
            success: true,
            url: publicPath,
            path: filePath,
            note: "File stored locally as SFTP fallback",
        })
    } catch (error) {
        console.error("Error in local file upload:", error)
        return NextResponse.json(
            {
                success: false,
                error: `Local file upload failed: ${error instanceof Error ? error.message : String(error)}`,
            },
            { status: 500 },
        )
    }
}
