"use client"

import type React from "react"
import { uploadWithProgress } from "@/lib/upload-with-progress"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Upload, Folder, File, Trash2, ArrowLeft } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import type { FileItem } from "@/lib/file-manager"

export default function FileManagerPage() {
  const { user, isAdmin, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [files, setFiles] = useState<FileItem[]>([])
  const [currentPath, setCurrentPath] = useState("/")
  const [uploading, setUploading] = useState(false)
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/auth")
    }
  }, [user, isAdmin, loading, router])

  useEffect(() => {
    if (user && isAdmin) {
      loadFiles()
    }
  }, [currentPath, user, isAdmin])

  const loadFiles = async () => {
    setLoadingFiles(true)
    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(currentPath)}`)
      if (response.ok) {
        const fileList = await response.json()
        setFiles(fileList)
      } else {
        toast({
          title: "Error",
          description: "Failed to load files",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to file server",
        variant: "destructive",
      })
    } finally {
      setLoadingFiles(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const path = currentPath

      console.log(`Uploading file: ${file.name} to ${path}`)

      // Try SFTP upload first with progress tracking
      try {
        const result = await uploadWithProgress("/api/files", file, path, (percentage) => {
          console.log(`Upload progress: ${percentage}%`)
          setUploadProgress(percentage)
        })

        if (result.success) {
          toast({
            title: "Success!",
            description: `File uploaded: ${file.name}`,
          })
          loadFiles() // Refresh file list
        } else {
          throw new Error("Upload response missing success flag")
        }
      } catch (sftpError) {
        console.error("SFTP upload failed:", sftpError)

        // Reset progress for fallback attempt
        setUploadProgress(0)

        toast({
          title: "SFTP upload failed",
          description: "Trying local storage fallback...",
          variant: "destructive",
        })

        // Try local fallback with progress tracking
        const fallbackResult = await uploadWithProgress("/api/files/local", file, path, (percentage) => {
          console.log(`Local fallback upload progress: ${percentage}%`)
          setUploadProgress(percentage)
        })

        if (fallbackResult.success) {
          toast({
            title: "Success!",
            description: `File uploaded locally: ${file.name}`,
          })
          loadFiles() // Refresh file list
        } else {
          throw new Error("Local fallback also failed")
        }
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      // Reset input
      event.target.value = ""
    }
  }

  const handleDeleteFile = async (fileName: string) => {
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) return

    try {
      const filePath = `${currentPath}/${fileName}`.replace("//", "/")
      const response = await fetch("/api/files", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path: filePath }),
      })

      if (response.ok) {
        toast({
          title: "Success!",
          description: `File deleted: ${fileName}`,
        })
        loadFiles() // Refresh file list
      } else {
        throw new Error("Delete failed")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      })
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

  if (loading) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => router.push("/admin")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
                <h1 className="text-xl font-light tracking-wide text-gray-900">File Manager</h1>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Upload Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Upload Files</CardTitle>
              <CardDescription>Upload images and assets to your server at: {currentPath}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Input type="file" onChange={handleFileUpload} disabled={uploading} accept="image/*" className="flex-1" />
                <Button disabled={uploading}>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>

              {uploading && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Uploading {uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Current path:</span>
                <code className="bg-gray-100 px-2 py-1 rounded">{currentPath}</code>
                {currentPath !== "/" && (
                    <Button variant="outline" size="sm" onClick={navigateUp}>
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Up
                    </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* File List */}
          <Card>
            <CardHeader>
              <CardTitle>Files and Folders</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingFiles ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading files...</p>
                  </div>
              ) : files.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No files found in this directory</div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {files.map((file) => (
                        <div key={file.name} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {file.type === "directory" ? (
                                  <Folder className="h-5 w-5 text-blue-500" />
                              ) : (
                                  <File className="h-5 w-5 text-gray-500" />
                              )}
                              <span className="text-sm font-medium truncate">{file.name}</span>
                            </div>
                            {file.type === "file" && (
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteFile(file.name)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            )}
                          </div>

                          {file.type === "file" && isImage(file.name) && file.url && (
                              <div className="mb-2">
                                <Image
                                    src={file.url || "/placeholder.svg"}
                                    alt={file.name}
                                    width={200}
                                    height={150}
                                    className="w-full h-32 object-cover rounded"
                                />
                              </div>
                          )}

                          <div className="text-xs text-gray-500 space-y-1">
                            {file.size && <div>Size: {(file.size / 1024).toFixed(1)} KB</div>}
                            {file.lastModified && <div>Modified: {new Date(file.lastModified).toLocaleDateString()}</div>}
                            {file.url && (
                                <div className="break-all">
                                  <a
                                      href={file.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-500 hover:underline"
                                  >
                                    View File
                                  </a>
                                </div>
                            )}
                          </div>

                          {file.type === "directory" && (
                              <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full mt-2"
                                  onClick={() => navigateToFolder(file.name)}
                              >
                                Open Folder
                              </Button>
                          )}
                        </div>
                    ))}
                  </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
