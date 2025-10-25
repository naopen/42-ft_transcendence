/**
 * Mobile device detection and utilities
 */

/**
 * Check if the current device is a mobile device
 * @returns true if mobile device, false otherwise
 */
export function isMobileDevice(): boolean {
  // Check for touch capability
  const hasTouch =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0

  // Check screen width (consider devices with width <= 1024px as mobile/tablet)
  const isMobileWidth = window.innerWidth <= 1024

  // Check user agent for mobile keywords
  const mobileKeywords =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
  const hasMobileUA = mobileKeywords.test(navigator.userAgent)

  // Consider it mobile if it has touch AND (small screen OR mobile UA)
  return hasTouch && (isMobileWidth || hasMobileUA)
}

/**
 * Check if the device is in portrait orientation
 * @returns true if portrait, false if landscape
 */
export function isPortrait(): boolean {
  return window.innerHeight > window.innerWidth
}

/**
 * Get optimal canvas size for the current viewport
 * Maintains 16:9 aspect ratio while fitting within viewport
 * @param maxWidth Maximum width constraint
 * @param maxHeight Maximum height constraint
 * @returns {width, height} optimal canvas dimensions
 */
export function getOptimalCanvasSize(
  maxWidth?: number,
  maxHeight?: number,
): { width: number; height: number } {
  const viewportWidth = maxWidth || window.innerWidth
  const viewportHeight = maxHeight || window.innerHeight

  // Target aspect ratio (16:9 for game canvas)
  const targetRatio = 16 / 9

  // Calculate dimensions to fit within viewport
  let width = viewportWidth
  let height = width / targetRatio

  // If height exceeds viewport, recalculate based on height
  if (height > viewportHeight) {
    height = viewportHeight
    width = height * targetRatio
  }

  // On mobile, use more of the screen (reduce padding)
  if (isMobileDevice()) {
    // Use 95% of available space on mobile
    const scaleFactor = 0.95
    width = Math.min(width * scaleFactor, viewportWidth * scaleFactor)
    height = width / targetRatio
  } else {
    // Use 90% of available space on desktop
    const scaleFactor = 0.9
    width = Math.min(width * scaleFactor, viewportWidth * scaleFactor)
    height = width / targetRatio
  }

  return {
    width: Math.floor(width),
    height: Math.floor(height),
  }
}
