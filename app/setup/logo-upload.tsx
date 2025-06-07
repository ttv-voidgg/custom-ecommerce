"use client"

import type React from "react"

import { useState } from "react"
import { toast } from "react-toastify"

const LogoUpload = ({ onLogoUploaded }) => {
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState(null)
    const [localImageUrl, setLocalImageUrl] = useState(null)

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        setUploadError(null)

        // Create a local preview immediately
        const localUrl = URL.createObjectURL(file)
        setLocalImageUrl(localUrl)

        try {
            toast({
                title: "Uploading logo...",
                description: "Please wait while we upload your logo",
            })

            const formData = new FormData()
            formData.append("file", file)
            formData.append("path", "/logos")

            console.log("Uploading logo to /logos directory")
            let response = await fetch("/api/files", {
                method: "POST",
                body: formData,
            })

            // If SFTP upload fails, try local fallback
            if (!response.ok) {
                console.log("SFTP upload failed, trying local fallback...")

                // Create a new FormData for the fallback request
                const fallbackFormData = new FormData()
                fallbackFormData.append("file", file)
                fallbackFormData.append("path", "/logos")

                response = await fetch("/api/files/local", {
                    method: "POST",
                    body: fallbackFormData,
                })

                if (!response.ok) {
                    let errorMessage = "Upload failed with both SFTP and local fallback"
                    try {
                        const errorData = await response.json()
                        errorMessage = errorData.error || errorMessage
                    } catch (e) {
                        errorMessage = `Upload failed with status: ${response.status} ${response.statusText}`
                    }
                    throw new Error(errorMessage)
                }
            }

            const result = await response.json()
            console.log("Logo upload result:", result)

            if (result.success && result.url) {
                onLogoUploaded(result.url)
                toast({
                    title: "Logo uploaded!",
                    description: result.note
                        ? `${result.note}. You can update it later in settings.`
                        : "Your store logo has been uploaded successfully",
                })
            } else {
                throw new Error("Upload response missing URL")
            }
        } catch (error) {
            console.error("Logo upload error:", error)
            const errorMessage = error instanceof Error ? error.message : "Failed to upload logo"
            setUploadError(errorMessage)

            toast({
                title: "Upload failed",
                description: errorMessage,
                variant: "destructive",
            })

            // Use the local preview as a fallback
            if (localUrl) {
                toast({
                    title: "Using local preview",
                    description: "We'll use a local preview for now. You can update your logo later in settings.",
                })
                onLogoUploaded(localUrl)
            }
        } finally {
            setUploading(false)
        }
    }

    return <div>{/* Logo upload component code here */}</div>
}

export default LogoUpload
