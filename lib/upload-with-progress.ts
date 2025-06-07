/**
 * Upload a file with progress tracking
 * @param url The API endpoint URL
 * @param file The file to upload
 * @param path The destination path
 * @param onProgress Callback function for progress updates
 * @returns Promise that resolves with the upload result
 */
export async function uploadWithProgress(
    url: string,
    file: File,
    path: string,
    onProgress?: (percentage: number) => void,
): Promise<any> {
    return new Promise((resolve, reject) => {
        // Create form data
        const formData = new FormData()
        formData.append("file", file)
        formData.append("path", path)

        // Create XHR request (supports progress tracking)
        const xhr = new XMLHttpRequest()

        // Setup progress tracking
        xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable && onProgress) {
                const percentage = Math.round((event.loaded / event.total) * 100)
                onProgress(percentage)
            }
        })

        // Handle completion
        xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText)
                    resolve(response)
                } catch (error) {
                    reject(new Error(`Invalid JSON response: ${xhr.responseText}`))
                }
            } else {
                try {
                    const errorResponse = JSON.parse(xhr.responseText)
                    reject(new Error(errorResponse.error || `HTTP Error: ${xhr.status}`))
                } catch (e) {
                    reject(new Error(`HTTP Error: ${xhr.status} ${xhr.statusText}`))
                }
            }
        })

        // Handle network errors
        xhr.addEventListener("error", () => {
            reject(new Error("Network error occurred during upload"))
        })

        // Handle timeouts
        xhr.addEventListener("timeout", () => {
            reject(new Error("Upload timed out"))
        })

        // Handle aborts
        xhr.addEventListener("abort", () => {
            reject(new Error("Upload was aborted"))
        })

        // Open and send the request
        xhr.open("POST", url)
        xhr.send(formData)
    })
}
