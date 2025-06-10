"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Crop, RotateCcw, Check, X, AlertTriangle } from "lucide-react"

interface ImageCropperProps {
    isOpen: boolean
    onClose: () => void
    onCrop: (croppedImageUrl: string) => void
    imageUrl: string
    aspectRatio?: number
    suggestedWidth?: number
    suggestedHeight?: number
}

interface CropArea {
    x: number
    y: number
    width: number
    height: number
}

type ResizeHandle = "nw" | "ne" | "sw" | "se" | null

export function ImageCropper({
                                 isOpen,
                                 onClose,
                                 onCrop,
                                 imageUrl,
                                 aspectRatio = 475 / 925, // Default to 475:925 ratio
                                 suggestedWidth = 475,
                                 suggestedHeight = 925,
                             }: ImageCropperProps) {
    const [crop, setCrop] = useState<CropArea>({ x: 0, y: 0, width: 100, height: 100 })
    const [isDragging, setIsDragging] = useState(false)
    const [isResizing, setIsResizing] = useState<ResizeHandle>(null)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, crop: { x: 0, y: 0, width: 0, height: 0 } })
    const [imageLoaded, setImageLoaded] = useState(false)
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
    const [imageError, setImageError] = useState(false)
    const [isCropping, setIsCropping] = useState(false)
    const imageRef = useRef<HTMLImageElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Create proxied image URL to avoid CORS issues
    const proxiedImageUrl = imageUrl ? `/api/images/proxy?url=${encodeURIComponent(imageUrl)}` : ""

    const handleImageLoad = useCallback(() => {
        console.log("Image loaded successfully")
        if (imageRef.current && containerRef.current) {
            const img = imageRef.current
            const container = containerRef.current

            // Calculate display dimensions while maintaining aspect ratio
            const containerWidth = container.clientWidth
            const containerHeight = container.clientHeight

            const imageAspectRatio = img.naturalWidth / img.naturalHeight
            const containerAspectRatio = containerWidth / containerHeight

            let displayWidth, displayHeight

            if (imageAspectRatio > containerAspectRatio) {
                displayWidth = containerWidth
                displayHeight = containerWidth / imageAspectRatio
            } else {
                displayHeight = containerHeight
                displayWidth = containerHeight * imageAspectRatio
            }

            setImageDimensions({ width: displayWidth, height: displayHeight })

            // Initialize crop area in the center
            const cropWidth = Math.min(displayWidth * 0.6, displayHeight * aspectRatio * 0.6)
            const cropHeight = cropWidth / aspectRatio

            setCrop({
                x: (displayWidth - cropWidth) / 2,
                y: (displayHeight - cropHeight) / 2,
                width: cropWidth,
                height: cropHeight,
            })

            setImageLoaded(true)
            setImageError(false)
        }
    }, [aspectRatio])

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        console.error("Image load error:", e)
        setImageError(true)
    }

    const handleMouseDown = (e: React.MouseEvent, handle?: ResizeHandle) => {
        e.preventDefault()
        e.stopPropagation()

        if (handle) {
            setIsResizing(handle)
            setResizeStart({
                x: e.clientX,
                y: e.clientY,
                crop: { ...crop },
            })
        } else {
            setIsDragging(true)
            setDragStart({ x: e.clientX - crop.x, y: e.clientY - crop.y })
        }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!imageLoaded) return

        if (isDragging) {
            const newX = Math.max(0, Math.min(e.clientX - dragStart.x, imageDimensions.width - crop.width))
            const newY = Math.max(0, Math.min(e.clientY - dragStart.y, imageDimensions.height - crop.height))
            setCrop((prev) => ({ ...prev, x: newX, y: newY }))
        } else if (isResizing) {
            const deltaX = e.clientX - resizeStart.x
            const deltaY = e.clientY - resizeStart.y
            const startCrop = resizeStart.crop

            const newCrop = { ...startCrop }

            switch (isResizing) {
                case "nw":
                    newCrop.x = startCrop.x + deltaX
                    newCrop.y = startCrop.y + deltaY
                    newCrop.width = startCrop.width - deltaX
                    newCrop.height = startCrop.height - deltaY
                    break
                case "ne":
                    newCrop.y = startCrop.y + deltaY
                    newCrop.width = startCrop.width + deltaX
                    newCrop.height = startCrop.height - deltaY
                    break
                case "sw":
                    newCrop.x = startCrop.x + deltaX
                    newCrop.width = startCrop.width - deltaX
                    newCrop.height = startCrop.height + deltaY
                    break
                case "se":
                    newCrop.width = startCrop.width + deltaX
                    newCrop.height = startCrop.height + deltaY
                    break
            }

            // Maintain aspect ratio
            const currentAspectRatio = newCrop.width / newCrop.height
            if (currentAspectRatio !== aspectRatio) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    newCrop.height = newCrop.width / aspectRatio
                    if (isResizing === "nw" || isResizing === "ne") {
                        newCrop.y = startCrop.y + startCrop.height - newCrop.height
                    }
                } else {
                    newCrop.width = newCrop.height * aspectRatio
                    if (isResizing === "nw" || isResizing === "sw") {
                        newCrop.x = startCrop.x + startCrop.width - newCrop.width
                    }
                }
            }

            // Ensure crop area stays within image bounds
            newCrop.x = Math.max(0, Math.min(newCrop.x, imageDimensions.width - newCrop.width))
            newCrop.y = Math.max(0, Math.min(newCrop.y, imageDimensions.height - newCrop.height))
            newCrop.width = Math.max(50, Math.min(newCrop.width, imageDimensions.width - newCrop.x))
            newCrop.height = Math.max(50 / aspectRatio, Math.min(newCrop.height, imageDimensions.height - newCrop.y))

            // Re-adjust to maintain aspect ratio after bounds checking
            if (newCrop.width / newCrop.height !== aspectRatio) {
                const widthBasedHeight = newCrop.width / aspectRatio
                const heightBasedWidth = newCrop.height * aspectRatio

                if (widthBasedHeight <= imageDimensions.height - newCrop.y) {
                    newCrop.height = widthBasedHeight
                } else {
                    newCrop.width = heightBasedWidth
                }
            }

            setCrop(newCrop)
        }
    }

    const handleMouseUp = () => {
        setIsDragging(false)
        setIsResizing(null)
    }

    const generateUniqueFilename = (originalUrl: string): string => {
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(2, 8)

        // Extract filename from URL
        const urlParts = originalUrl.split("/")
        const filename = urlParts[urlParts.length - 1]
        const nameWithoutExt = filename.split(".")[0]
        const extension = filename.split(".").pop() || "jpg"

        return `${nameWithoutExt}_cropped_${timestamp}_${random}.${extension}`
    }

    const handleCrop = async () => {
        if (!imageRef.current || !imageLoaded) {
            console.log("Using original image URL due to load failure")
            onCrop(imageUrl)
            return
        }

        setIsCropping(true)

        try {
            const canvas = document.createElement("canvas")
            const ctx = canvas.getContext("2d")
            if (!ctx) {
                throw new Error("Could not get canvas context")
            }

            const img = imageRef.current

            // Calculate scale factors
            const scaleX = img.naturalWidth / imageDimensions.width
            const scaleY = img.naturalHeight / imageDimensions.height

            // Set canvas size to suggested dimensions
            canvas.width = suggestedWidth
            canvas.height = suggestedHeight

            // Calculate source crop area in original image coordinates
            const sourceX = crop.x * scaleX
            const sourceY = crop.y * scaleY
            const sourceWidth = crop.width * scaleX
            const sourceHeight = crop.height * scaleY

            // Draw the cropped and resized image
            ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, suggestedWidth, suggestedHeight)

            // Convert to blob
            canvas.toBlob(
                async (blob) => {
                    if (blob) {
                        try {
                            // Generate unique filename
                            const uniqueFilename = generateUniqueFilename(imageUrl)

                            // Create FormData to upload the cropped image
                            const formData = new FormData()
                            formData.append("file", blob, uniqueFilename)

                            // Upload the cropped image
                            const uploadResponse = await fetch("/api/files", {
                                method: "POST",
                                body: formData,
                            })

                            if (uploadResponse.ok) {
                                const uploadResult = await uploadResponse.json()
                                if (uploadResult.success && uploadResult.url) {
                                    console.log("Cropped image uploaded successfully:", uploadResult.url)
                                    onCrop(uploadResult.url) // This should be the full URL from the server
                                } else {
                                    throw new Error("Upload failed: " + (uploadResult.error || "Unknown error"))
                                }
                            } else {
                                const errorText = await uploadResponse.text()
                                throw new Error(`Upload request failed: ${uploadResponse.status} ${errorText}`)
                            }
                        } catch (uploadError) {
                            console.error("Error uploading cropped image:", uploadError)
                            // Fallback to blob URL
                            const croppedUrl = URL.createObjectURL(blob)
                            onCrop(croppedUrl)
                        }
                    } else {
                        console.error("Failed to create blob from canvas")
                        onCrop(imageUrl)
                    }
                    setIsCropping(false)
                },
                "image/jpeg",
                0.9,
            )
        } catch (error) {
            console.error("Error cropping image:", error)
            // Fallback to original URL
            onCrop(imageUrl)
            setIsCropping(false)
        }
    }

    const resetCrop = () => {
        if (!imageLoaded) return

        const cropWidth = Math.min(imageDimensions.width * 0.6, imageDimensions.height * aspectRatio * 0.6)
        const cropHeight = cropWidth / aspectRatio

        setCrop({
            x: (imageDimensions.width - cropWidth) / 2,
            y: (imageDimensions.height - cropHeight) / 2,
            width: cropWidth,
            height: cropHeight,
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Crop Banner Image</DialogTitle>
                    <p className="text-sm text-gray-500">
                        Select and resize the area you want to display. Recommended size: {suggestedWidth} × {suggestedHeight}px
                    </p>
                    <p className="text-xs text-gray-400">
                        Drag to move the crop area, use corner handles to resize while maintaining aspect ratio.
                    </p>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    <div
                        ref={containerRef}
                        className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden"
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        {imageError ? (
                            <div className="absolute inset-0 flex items-center justify-center text-red-500">
                                <div className="text-center max-w-md">
                                    <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
                                    <p className="font-medium">Failed to load image</p>
                                    <p className="text-xs mt-2 text-gray-600">
                                        Could not load image for cropping. This might be due to CORS restrictions.
                                    </p>
                                    <div className="mt-4 space-x-2">
                                        <Button onClick={() => onClose()} variant="outline" size="sm">
                                            Cancel
                                        </Button>
                                        <Button onClick={() => onCrop(imageUrl)} variant="default" size="sm">
                                            Use Original URL
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <img
                                ref={imageRef}
                                src={proxiedImageUrl || "/placeholder.svg"}
                                alt="Crop preview"
                                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-full max-h-full object-contain"
                                onLoad={handleImageLoad}
                                onError={handleImageError}
                                draggable={false}
                                crossOrigin="anonymous"
                            />
                        )}

                        {imageLoaded && !imageError && (
                            <>
                                {/* Overlay */}
                                <div className="absolute inset-0 bg-black bg-opacity-50" />

                                {/* Crop area */}
                                <div
                                    className="absolute border-2 border-white shadow-lg cursor-move select-none"
                                    style={{
                                        left: `${(containerRef.current?.clientWidth || 0) / 2 - imageDimensions.width / 2 + crop.x}px`,
                                        top: `${(containerRef.current?.clientHeight || 0) / 2 - imageDimensions.height / 2 + crop.y}px`,
                                        width: `${crop.width}px`,
                                        height: `${crop.height}px`,
                                        backgroundColor: "transparent",
                                    }}
                                    onMouseDown={(e) => handleMouseDown(e)}
                                >
                                    {/* Resize handles */}
                                    <div
                                        className="absolute -top-2 -left-2 w-4 h-4 bg-white border border-gray-300 rounded-full cursor-nw-resize hover:bg-blue-100"
                                        onMouseDown={(e) => handleMouseDown(e, "nw")}
                                    />
                                    <div
                                        className="absolute -top-2 -right-2 w-4 h-4 bg-white border border-gray-300 rounded-full cursor-ne-resize hover:bg-blue-100"
                                        onMouseDown={(e) => handleMouseDown(e, "ne")}
                                    />
                                    <div
                                        className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border border-gray-300 rounded-full cursor-sw-resize hover:bg-blue-100"
                                        onMouseDown={(e) => handleMouseDown(e, "sw")}
                                    />
                                    <div
                                        className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border border-gray-300 rounded-full cursor-se-resize hover:bg-blue-100"
                                        onMouseDown={(e) => handleMouseDown(e, "se")}
                                    />

                                    {/* Center indicator */}
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                                        <Crop className="h-6 w-6 text-white opacity-75" />
                                    </div>

                                    {/* Crop info */}
                                    <div className="absolute -top-8 left-0 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded pointer-events-none">
                                        {Math.round(crop.width)} × {Math.round(crop.height)}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex justify-between">
                    <Button variant="outline" onClick={resetCrop} disabled={!imageLoaded || imageError || isCropping}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                    </Button>
                    <div className="space-x-2">
                        <Button variant="outline" onClick={onClose} disabled={isCropping}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                        </Button>
                        <Button onClick={handleCrop} disabled={!imageLoaded || imageError || isCropping}>
                            {isCropping ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Cropping...
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Apply Crop
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
