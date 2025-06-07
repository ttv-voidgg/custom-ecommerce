import { type NextRequest, NextResponse } from "next/server"
import { Buffer } from "buffer"

// Decode base64 password
function decodeBase64(str: string): string {
  try {
    return Buffer.from(str, "base64").toString("utf-8")
  } catch (error) {
    console.error("Error decoding base64:", error)
    return str // Return original if decoding fails
  }
}

// Use environment variables for SFTP configuration
const SFTP_CONFIG = {
  host: process.env.SFTP_HOST!,
  port: Number.parseInt(process.env.SFTP_PORT || "22"),
  username: process.env.SFTP_USERNAME!,
  password: decodeBase64(process.env.SFTP_PASSWORD!),
}

const SFTP_BASE_URL = process.env.SFTP_BASE_URL!
const SFTP_BASE_DIR = process.env.SFTP_BASE_DIR || "/public_html/hosted_sites/webriver-amp/assets/ecommerce"

// GET handler for listing files
export async function GET(request: NextRequest) {
  console.log("=== SFTP File Listing Starting ===")

  // Import SFTP client dynamically
  let Client
  try {
    const sftpModule = await import("ssh2-sftp-client")
    Client = sftpModule.default
    console.log("✅ ssh2-sftp-client imported successfully")
  } catch (importError) {
    console.error("❌ Failed to import ssh2-sftp-client:", importError)
    return NextResponse.json(
        {
          success: false,
          error: "SFTP client not available",
          details: "ssh2-sftp-client package could not be loaded",
        },
        { status: 500 },
    )
  }

  const sftpClient = new Client()

  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get("path") || "/"

    console.log("📁 Listing files for path:", path)

    // Normalize path
    const normalizedPath = path.startsWith("/") ? path : `/${path}`
    const remotePath = `${SFTP_BASE_DIR}${normalizedPath}`.replace(/\/+/g, "/")

    console.log("🎯 Remote path:", remotePath)

    // Connect to SFTP
    console.log("🔌 Connecting to SFTP server...")
    await sftpClient.connect(SFTP_CONFIG)
    console.log("✅ SFTP connection established")

    // List files in directory
    console.log(`📂 Listing files in: ${remotePath}`)
    const files = await sftpClient.list(remotePath)
    console.log(`✅ Found ${files.length} items`)

    // Format files for response
    const formattedFiles = files.map((file) => ({
      name: file.name,
      type: file.type === "d" ? "directory" : "file",
      size: file.size,
      lastModified: new Date(file.modifyTime).toISOString(),
      url: file.type !== "d" ? `${SFTP_BASE_URL}${normalizedPath}/${file.name}`.replace(/\/+/g, "/") : undefined,
    }))

    console.log("=== SFTP File Listing Completed Successfully ===")

    return NextResponse.json(formattedFiles)
  } catch (error: any) {
    console.error("=== SFTP File Listing Failed ===")
    console.error("❌ Listing error:", error)

    // Provide specific error messages
    let errorMessage = "SFTP file listing failed"
    let statusCode = 500

    if (error.code === "ENOTFOUND") {
      errorMessage = "SFTP server not found"
      statusCode = 503
    } else if (error.code === "ECONNREFUSED") {
      errorMessage = "SFTP connection refused"
      statusCode = 503
    } else if (error.message?.includes("Authentication") || error.message?.includes("authentication")) {
      errorMessage = "SFTP authentication failed"
      statusCode = 401
    } else if (error.message?.includes("Permission denied") || error.message?.includes("permission")) {
      errorMessage = "SFTP permission denied"
      statusCode = 403
    } else if (error.message?.includes("No such file") || error.message?.includes("directory")) {
      errorMessage = "Directory not found"
      statusCode = 404
    }

    return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: error.message || String(error),
          code: error.code || "UNKNOWN",
        },
        { status: statusCode },
    )
  } finally {
    try {
      await sftpClient.end()
      console.log("🔌 SFTP connection closed")
    } catch (closeError) {
      console.error("⚠️ Error closing SFTP connection:", closeError)
    }
  }
}

// POST handler for file uploads
export async function POST(request: NextRequest) {
  console.log("=== SFTP File Upload Starting ===")

  // Import SFTP client dynamically
  let Client
  try {
    const sftpModule = await import("ssh2-sftp-client")
    Client = sftpModule.default
    console.log("✅ ssh2-sftp-client imported successfully")
  } catch (importError) {
    console.error("❌ Failed to import ssh2-sftp-client:", importError)
    return NextResponse.json(
        {
          success: false,
          error: "SFTP client not available",
          details: "ssh2-sftp-client package could not be loaded",
        },
        { status: 500 },
    )
  }

  const sftpClient = new Client()

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const path = (formData.get("path") as string) || "/"

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    console.log("📁 File upload details:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadPath: path,
    })

    console.log("🔧 SFTP Configuration:", {
      host: SFTP_CONFIG.host,
      port: SFTP_CONFIG.port,
      username: SFTP_CONFIG.username,
      passwordLength: SFTP_CONFIG.password.length,
      baseDir: SFTP_BASE_DIR,
      baseUrl: SFTP_BASE_URL,
    })

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    console.log(`📦 File converted to buffer: ${buffer.length} bytes`)

    // Normalize path to ensure it starts with a slash
    const normalizedPath = path.startsWith("/") ? path : `/${path}`
    console.log(`📂 Normalized upload path: ${normalizedPath}`)

    // Create full remote paths
    const dirPath = `${SFTP_BASE_DIR}${normalizedPath}`.replace(/\/+/g, "/")
    const remotePath = `${dirPath}/${file.name}`.replace(/\/+/g, "/")

    console.log(`🎯 Target directory: ${dirPath}`)
    console.log(`🎯 Target file path: ${remotePath}`)

    // Connect to SFTP
    console.log("🔌 Connecting to SFTP server...")
    await sftpClient.connect(SFTP_CONFIG)
    console.log("✅ SFTP connection established")

    // Ensure directory exists
    console.log(`📁 Ensuring directory exists: ${dirPath}`)
    try {
      const dirStat = await sftpClient.stat(dirPath)
      console.log("✅ Directory already exists:", dirStat)
    } catch (dirError) {
      console.log("📁 Directory doesn't exist, creating it...")
      try {
        await sftpClient.mkdir(dirPath, true)
        console.log("✅ Directory created successfully")
      } catch (createError) {
        console.error("❌ Failed to create directory:", createError)
        throw new Error(
            `Cannot create directory: ${createError instanceof Error ? createError.message : String(createError)}`,
        )
      }
    }

    // Upload the file
    console.log(`⬆️ Uploading file to: ${remotePath}`)
    await sftpClient.put(buffer, remotePath)
    console.log("✅ File uploaded successfully!")

    // Generate public URL
    const publicPath = `${normalizedPath}/${file.name}`.replace(/\/+/g, "/")
    const fileUrl = `${SFTP_BASE_URL}${publicPath}`

    console.log(`🌐 Generated public URL: ${fileUrl}`)
    console.log("=== SFTP File Upload Completed Successfully ===")

    return NextResponse.json({
      success: true,
      url: fileUrl,
      path: remotePath,
      message: "File uploaded to SFTP successfully",
    })
  } catch (error: any) {
    console.error("=== SFTP File Upload Failed ===")
    console.error("❌ Upload error:", error)
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack?.split("\n").slice(0, 5).join("\n"), // First 5 lines of stack
    })

    // Provide specific error messages
    let errorMessage = "SFTP upload failed"
    let statusCode = 500

    if (error.code === "ENOTFOUND") {
      errorMessage = "SFTP server not found"
      statusCode = 503
    } else if (error.code === "ECONNREFUSED") {
      errorMessage = "SFTP connection refused"
      statusCode = 503
    } else if (error.message?.includes("Authentication") || error.message?.includes("authentication")) {
      errorMessage = "SFTP authentication failed"
      statusCode = 401
    } else if (error.message?.includes("Permission denied") || error.message?.includes("permission")) {
      errorMessage = "SFTP permission denied"
      statusCode = 403
    } else if (error.message?.includes("No such file") || error.message?.includes("directory")) {
      errorMessage = "SFTP directory error"
      statusCode = 404
    }

    return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: error.message || String(error),
          code: error.code || "UNKNOWN",
        },
        { status: statusCode },
    )
  } finally {
    try {
      await sftpClient.end()
      console.log("🔌 SFTP connection closed")
    } catch (closeError) {
      console.error("⚠️ Error closing SFTP connection:", closeError)
    }
  }
}

// DELETE handler for file deletion
export async function DELETE(request: NextRequest) {
  console.log("=== SFTP File Deletion Starting ===")

  // Import SFTP client dynamically
  let Client
  try {
    const sftpModule = await import("ssh2-sftp-client")
    Client = sftpModule.default
    console.log("✅ ssh2-sftp-client imported successfully")
  } catch (importError) {
    console.error("❌ Failed to import ssh2-sftp-client:", importError)
    return NextResponse.json(
        {
          success: false,
          error: "SFTP client not available",
          details: "ssh2-sftp-client package could not be loaded",
        },
        { status: 500 },
    )
  }

  const sftpClient = new Client()

  try {
    const { path } = await request.json()

    if (!path) {
      return NextResponse.json({ success: false, error: "No file path provided" }, { status: 400 })
    }

    console.log("🗑️ Deleting file:", path)

    // Normalize path
    const normalizedPath = path.startsWith("/") ? path : `/${path}`
    const remotePath = `${SFTP_BASE_DIR}${normalizedPath}`.replace(/\/+/g, "/")

    console.log("🎯 Remote file path:", remotePath)

    // Connect to SFTP
    console.log("🔌 Connecting to SFTP server...")
    await sftpClient.connect(SFTP_CONFIG)
    console.log("✅ SFTP connection established")

    // Delete the file
    console.log(`🗑️ Deleting file: ${remotePath}`)
    await sftpClient.delete(remotePath)
    console.log("✅ File deleted successfully!")

    console.log("=== SFTP File Deletion Completed Successfully ===")

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    })
  } catch (error: any) {
    console.error("=== SFTP File Deletion Failed ===")
    console.error("❌ Deletion error:", error)

    // Provide specific error messages
    let errorMessage = "SFTP file deletion failed"
    let statusCode = 500

    if (error.code === "ENOTFOUND") {
      errorMessage = "SFTP server not found"
      statusCode = 503
    } else if (error.code === "ECONNREFUSED") {
      errorMessage = "SFTP connection refused"
      statusCode = 503
    } else if (error.message?.includes("Authentication") || error.message?.includes("authentication")) {
      errorMessage = "SFTP authentication failed"
      statusCode = 401
    } else if (error.message?.includes("Permission denied") || error.message?.includes("permission")) {
      errorMessage = "SFTP permission denied"
      statusCode = 403
    } else if (error.message?.includes("No such file") || error.message?.includes("directory")) {
      errorMessage = "File not found"
      statusCode = 404
    }

    return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: error.message || String(error),
          code: error.code || "UNKNOWN",
        },
        { status: statusCode },
    )
  } finally {
    try {
      await sftpClient.end()
      console.log("🔌 SFTP connection closed")
    } catch (closeError) {
      console.error("⚠️ Error closing SFTP connection:", closeError)
    }
  }
}
