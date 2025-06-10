export function isCropUrl(url: string): boolean {
    return url.includes("#crop=")
}

export function getCroppedImageUrl(cropUrl: string): string {
    if (!isCropUrl(cropUrl)) {
        return cropUrl
    }

    return `/api/images/crop?url=${encodeURIComponent(cropUrl)}`
}

export function getDisplayImageUrl(imageUrl: string): string {
    if (!imageUrl) return imageUrl

    // If it's a crop URL, convert to cropped image API
    if (isCropUrl(imageUrl)) {
        return getCroppedImageUrl(imageUrl)
    }

    // Otherwise return as-is
    return imageUrl
}
