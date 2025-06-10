"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Folder, ArrowLeft, Search, ImageIcon } from "lucide-react"
import Image from "next/image"
import type { FileItem } from "@/lib/file-manager"

interface FileBrowserProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (fileUrl: string, fileName: string) => void
    title?: string
    acceptedTypes?: string[]
}

export function FileBrowser({
                                isOpen,
                                onClose,
                                onSelect,
                                title = "Select File",
                                acceptedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
                            }: FileBrowserProps) {
    const [files, setFiles] = useState<FileItem[]>([])
    const [currentPath, setCurrentPath] = useState("/")
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        if (isOpen) {
            loadFiles()
        }
    }, [currentPath, isOpen])

    const loadFiles = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/files?path=${encodeURIComponent(currentPath)}`)
            if (response.ok) {
                const fileList = await response.json()
                setFiles(fileList)
            }
        } catch (error) {
            console.error("Failed to load files:", error)
        } finally {
            setLoading(false)
        }
    }

    const navigateToFolder = (folderName: string) => {
        const newPath = `${currentPath}/${folderName}`.replace("//", "/")
        setCurrentPath(newPath)
    }

    const navigateUp = () => {
        const pathParts = currentPath.split("/").filter(Boolean)
        pathParts.pop()
        const newPath = "/" + pathParts.join("/")
        setCurrentPath(newPath)
    }

    const isImage = (fileName: string) => {
        const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]
        return imageExtensions.some((ext) => fileName.toLowerCase().endsWith(ext))
    }

    const filteredFiles = files.filter((file) => {
        if (searchTerm) {
            return file.name.toLowerCase().includes(searchTerm.toLowerCase())
        }
        return true
    })

    const imageFiles = filteredFiles.filter((file) => file.type === "directory" || isImage(file.name))

    const handleFileSelect = (file: FileItem) => {
        if (file.type === "file" && file.url && isImage(file.name)) {
            onSelect(file.url, file.name)
            onClose()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Navigation */}
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={navigateUp} disabled={currentPath === "/"}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Up
                        </Button>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">{currentPath}</code>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search files..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* File Grid */}
                    <ScrollArea className="h-96">
                        {loading ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            </div>
                        ) : imageFiles.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                {searchTerm ? "No matching files found" : "No image files found in this directory"}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-2">
                                {imageFiles.map((file) => (
                                    <div
                                        key={file.name}
                                        className={`border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer ${
                                            file.type === "directory" ? "bg-blue-50" : "bg-white"
                                        }`}
                                        onClick={() => {
                                            if (file.type === "directory") {
                                                navigateToFolder(file.name)
                                            } else {
                                                handleFileSelect(file)
                                            }
                                        }}
                                    >
                                        <div className="aspect-square mb-2 relative">
                                            {file.type === "directory" ? (
                                                <div className="flex items-center justify-center h-full">
                                                    <Folder className="h-12 w-12 text-blue-500" />
                                                </div>
                                            ) : isImage(file.name) && file.url ? (
                                                <Image
                                                    src={file.url || "/placeholder.svg"}
                                                    alt={file.name}
                                                    fill
                                                    className="object-cover rounded"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <ImageIcon className="h-12 w-12 text-gray-400" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-center">
                                            <p className="text-sm font-medium truncate" title={file.name}>
                                                {file.name}
                                            </p>
                                            {file.size && <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    {/* Actions */}
                    <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
