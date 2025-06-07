// File manager for SFTP server
export interface FileItem {
  name: string
  type: "file" | "directory"
  size?: number
  lastModified?: string
  url?: string
}

export class FileManager {
  private apiEndpoint = "/api/files" // We'll create this API route

  async uploadFile(file: File, path = "/"): Promise<string> {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("path", path)

    const response = await fetch(this.apiEndpoint, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Failed to upload file")
    }

    const result = await response.json()
    return result.url
  }

  async listFiles(path = "/"): Promise<FileItem[]> {
    const response = await fetch(`${this.apiEndpoint}?path=${encodeURIComponent(path)}`)

    if (!response.ok) {
      throw new Error("Failed to list files")
    }

    return response.json()
  }

  async deleteFile(path: string): Promise<void> {
    const response = await fetch(this.apiEndpoint, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path }),
    })

    if (!response.ok) {
      throw new Error("Failed to delete file")
    }
  }

  getFileUrl(path: string): string {
    // This will use the SFTP_BASE_URL from environment variables on the server
    return path // The server will return the full URL
  }
}

export const fileManager = new FileManager()
