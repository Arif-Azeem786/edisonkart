// Inline SVG placeholder for products with no image
export const NO_IMAGE_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3Ctext x='200' y='190' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%239ca3af'%3ENo Image%3C/text%3E%3Cpath d='M180 220 l10-14 8 10 12-18 14 22z' fill='%239ca3af'/%3E%3Ccircle cx='185' cy='200' r='5' fill='%239ca3af'/%3E%3C/svg%3E"

// Helper to get product image from backend GridFS
export const getProductImageUrl = (imageId) => {
  if (!imageId) return NO_IMAGE_PLACEHOLDER
  return `/api/products/image/${imageId}`
}

// Helper for user avatar
export const getUserAvatarUrl = (avatarId) => {
  if (!avatarId) return null
  return `/api/users/avatar/${avatarId}`
}

// Helper to get multiple images
export const getProductImages = (imageIds) => {
  return imageIds?.map(id => getProductImageUrl(id)) || []
}