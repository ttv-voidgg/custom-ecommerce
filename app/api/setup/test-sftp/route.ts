import { NextResponse } from "next/server"

export async function GET() {
    try {
        console.log("=== SFTP Connection Test Starting ===")

        // Check if all required environment variables are present
        const requiredVars = ["SFTP_HOST", "SFTP_PORT", "SFTP_USERNAME", "SFTP_PASSWORD", "SFTP_BASE_URL"]
        const missingVars = requiredVars.filter((varName) => !process.env[varName])

        if (missingVars.length > 0) {
            console.error("Missing SFTP environment variables:", missingVars)
            return NextResponse.json({
                success: false,
                error: "Missing SFTP configuration",
                details: `Missing environment variables: ${missingVars.join(", ")}`,
                troubleshooting: [
                    "Check your .env.local file",
                    "Ensure all SFTP_* variables are set",
                    "Restart your development server after adding variables",
                ],
            })
        }

        // Try to import ssh2-sftp-client
        let Client
        try {
            const sftpModule = await import("ssh2-sftp-client")
            Client = sftpModule.default
            console.log("✅ ssh2-sftp-client imported successfully")
        } catch (importError) {
            console.error("❌ Failed to import ssh2-sftp-client:", importError)
            return NextResponse.json({
                success: false,
                error: "SFTP client not available",
                details: "ssh2-sftp-client package could not be loaded",
                troubleshooting: [
                    "Install ssh2-sftp-client: npm install ssh2-sftp-client",
                    "Restart your development server",
                    "Check if the package is listed in package.json",
                ],
            })
        }

        const sftpClient = new Client()

        // Decode base64 password
        function decodeBase64(str: string): string {
            try {
                return Buffer.from(str, "base64").toString("utf-8")
            } catch (error) {
                console.error("Error decoding base64:", error)
                return str // Return original if decoding fails
            }
        }

        // Prepare SFTP configuration
        const SFTP_CONFIG = {
            host: process.env.SFTP_HOST!,
            port: Number.parseInt(process.env.SFTP_PORT || "22"),
            username: process.env.SFTP_USERNAME!,
            password: decodeBase64(process.env.SFTP_PASSWORD!),
        }

        const SFTP_BASE_DIR = process.env.SFTP_BASE_DIR || "/public_html/hosted_sites/webriver-amp/assets/ecommerce"
        const SFTP_BASE_URL = process.env.SFTP_BASE_URL!

        console.log("SFTP Configuration:", {
            host: SFTP_CONFIG.host,
            port: SFTP_CONFIG.port,
            username: SFTP_CONFIG.username,
            passwordLength: SFTP_CONFIG.password.length,
            baseDir: SFTP_BASE_DIR,
            baseUrl: SFTP_BASE_URL,
        })

        // Test connection
        console.log("Attempting SFTP connection...")
        await sftpClient.connect(SFTP_CONFIG)
        console.log("✅ SFTP connection successful")

        // Test directory access
        console.log(`Testing directory access: ${SFTP_BASE_DIR}`)
        let directoryExists = false
        let directoryFiles = []
        let parentDirectoryFiles = []
        let parentDirectory = ""

        try {
            const dirStat = await sftpClient.stat(SFTP_BASE_DIR)
            console.log("✅ Base directory accessible:", dirStat)
            directoryExists = true

            // List files in the base directory
            console.log(`Listing files in base directory: ${SFTP_BASE_DIR}`)
            directoryFiles = await sftpClient.list(SFTP_BASE_DIR)
            console.log(`Found ${directoryFiles.length} items in base directory`)

            // Also list parent directory to help with troubleshooting
            parentDirectory = SFTP_BASE_DIR.split("/").slice(0, -1).join("/") || "/"
            console.log(`Listing files in parent directory: ${parentDirectory}`)
            parentDirectoryFiles = await sftpClient.list(parentDirectory)
            console.log(`Found ${parentDirectoryFiles.length} items in parent directory`)
        } catch (dirError) {
            console.log("⚠️ Base directory doesn't exist, attempting to create...")

            // Try to list parent directory to help with troubleshooting
            try {
                parentDirectory = SFTP_BASE_DIR.split("/").slice(0, -1).join("/") || "/"
                console.log(`Listing files in parent directory: ${parentDirectory}`)
                parentDirectoryFiles = await sftpClient.list(parentDirectory)
                console.log(`Found ${parentDirectoryFiles.length} items in parent directory`)
            } catch (parentError) {
                console.error("❌ Cannot access parent directory:", parentError)
            }

            try {
                await sftpClient.mkdir(SFTP_BASE_DIR, true)
                console.log("✅ Base directory created successfully")
                directoryExists = true

                // List files in the newly created directory (should be empty)
                directoryFiles = await sftpClient.list(SFTP_BASE_DIR)
                console.log(`Found ${directoryFiles.length} items in newly created directory`)
            } catch (createError) {
                console.error("❌ Failed to create base directory:", createError)
                await sftpClient.end()
                return NextResponse.json({
                    success: false,
                    error: "Cannot access or create base directory",
                    details: `Directory error: ${createError instanceof Error ? createError.message : String(createError)}`,
                    parentDirectory: {
                        path: parentDirectory,
                        files: parentDirectoryFiles
                            .map((file) => ({
                                name: file.name,
                                type: file.type === "d" ? "directory" : "file",
                                size: file.size,
                                modifiedAt: file.modifyTime,
                            }))
                            .slice(0, 20), // Limit to 20 files to avoid huge responses
                    },
                    troubleshooting: [
                        "Check if the SFTP_BASE_DIR path is correct",
                        "Verify the user has permissions to create directories",
                        "Contact your hosting provider about directory permissions",
                        "Try a different base directory path",
                    ],
                })
            }
        }

        // Test write permissions by creating a test file
        const testFileName = `test-${Date.now()}.txt`
        const testFilePath = `${SFTP_BASE_DIR}/${testFileName}`
        const testContent = Buffer.from("SFTP connection test - this file can be safely deleted")

        console.log(`Testing write permissions with file: ${testFilePath}`)
        try {
            await sftpClient.put(testContent, testFilePath)
            console.log("✅ Write test successful")

            // Clean up test file
            try {
                await sftpClient.delete(testFilePath)
                console.log("✅ Test file cleanup successful")
            } catch (cleanupError) {
                console.warn("⚠️ Could not clean up test file:", cleanupError)
            }
        } catch (writeError) {
            console.error("❌ Write test failed:", writeError)
            await sftpClient.end()
            return NextResponse.json({
                success: false,
                error: "Write permission test failed",
                details: `Write error: ${writeError instanceof Error ? writeError.message : String(writeError)}`,
                directoryExists,
                directoryContents: directoryExists
                    ? directoryFiles
                        .map((file) => ({
                            name: file.name,
                            type: file.type === "d" ? "directory" : "file",
                            size: file.size,
                            modifiedAt: file.modifyTime,
                        }))
                        .slice(0, 20)
                    : [], // Limit to 20 files
                parentDirectory: {
                    path: parentDirectory,
                    files: parentDirectoryFiles
                        .map((file) => ({
                            name: file.name,
                            type: file.type === "d" ? "directory" : "file",
                            size: file.size,
                            modifiedAt: file.modifyTime,
                        }))
                        .slice(0, 20), // Limit to 20 files
                },
                troubleshooting: [
                    "Check if the user has write permissions to the directory",
                    "Verify the directory is not read-only",
                    "Contact your hosting provider about write permissions",
                    "Try uploading to a different directory",
                ],
            })
        }

        // Test directory listing
        console.log("Testing directory listing...")
        try {
            const files = await sftpClient.list(SFTP_BASE_DIR)
            console.log(`✅ Directory listing successful, found ${files.length} items`)
        } catch (listError) {
            console.error("❌ Directory listing failed:", listError)
            await sftpClient.end()
            return NextResponse.json({
                success: false,
                error: "Directory listing failed",
                details: `List error: ${listError instanceof Error ? listError.message : String(listError)}`,
                troubleshooting: [
                    "Check if the user has read permissions to the directory",
                    "Verify the directory exists and is accessible",
                    "Contact your hosting provider about directory permissions",
                ],
            })
        }

        // Close connection
        await sftpClient.end()
        console.log("=== SFTP Connection Test Completed Successfully ===")

        // Format directory files for display
        const formattedDirectoryFiles = directoryFiles
            .map((file) => ({
                name: file.name,
                type: file.type === "d" ? "directory" : "file",
                size: file.size,
                modifiedAt: new Date(file.modifyTime).toLocaleString(),
            }))
            .slice(0, 20) // Limit to 20 files to avoid huge responses

        return NextResponse.json({
            success: true,
            message: "SFTP connection test passed",
            details: {
                host: SFTP_CONFIG.host,
                port: SFTP_CONFIG.port,
                username: SFTP_CONFIG.username,
                baseDir: SFTP_BASE_DIR,
                baseUrl: SFTP_BASE_URL,
                tests: [
                    "✅ Connection established",
                    "✅ Directory access verified",
                    "✅ Write permissions confirmed",
                    "✅ Directory listing working",
                ],
            },
            directoryContents: {
                path: SFTP_BASE_DIR,
                files: formattedDirectoryFiles,
                totalFiles: directoryFiles.length,
            },
        })
    } catch (error: any) {
        console.error("=== SFTP Connection Test Failed ===")
        console.error("Error details:", error)

        let errorMessage = "SFTP connection failed"
        let troubleshooting = [
            "Verify SFTP server is running and accessible",
            "Check your SFTP credentials",
            "Ensure the server allows connections from your IP",
            "Verify the base directory path exists and is writable",
        ]

        // Provide specific error messages based on error type
        if (error.code === "ENOTFOUND") {
            errorMessage = "SFTP server not found"
            troubleshooting = [
                "Check the SFTP_HOST value in your .env.local",
                "Verify the hostname or IP address is correct",
                "Ensure you have internet connectivity",
                "Try pinging the server to verify it's reachable",
            ]
        } else if (error.code === "ECONNREFUSED") {
            errorMessage = "SFTP connection refused"
            troubleshooting = [
                "Check the SFTP_PORT value (usually 22 for SFTP)",
                "Verify the SFTP service is running on the server",
                "Check if a firewall is blocking the connection",
                "Ensure the server accepts SFTP connections",
            ]
        } else if (error.message?.includes("Authentication") || error.message?.includes("authentication")) {
            errorMessage = "SFTP authentication failed"
            troubleshooting = [
                "Verify your SFTP_USERNAME is correct",
                "Check your SFTP_PASSWORD is properly base64 encoded",
                "Ensure the user account exists on the server",
                "Verify the user has SFTP access permissions",
            ]
        } else if (error.message?.includes("Permission denied") || error.message?.includes("permission")) {
            errorMessage = "SFTP permission denied"
            troubleshooting = [
                "Check if the user has write permissions to the directory",
                "Verify the SFTP_BASE_DIR path is correct",
                "Ensure the directory exists or can be created",
                "Contact your hosting provider about SFTP permissions",
            ]
        }

        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
                details: error.message || String(error),
                code: error.code || "UNKNOWN",
                troubleshooting,
            },
            { status: 500 },
        )
    }
}
