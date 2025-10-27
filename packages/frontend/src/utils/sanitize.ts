/**
 * HTML Sanitization Utilities
 * Provides safe methods to handle user-generated content and prevent XSS attacks
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param unsafe - Raw string that may contain unsafe HTML
 * @returns Escaped string safe for insertion into HTML
 */
export function escapeHtml(unsafe: string): string {
  const div = document.createElement("div")
  div.textContent = unsafe
  return div.innerHTML
}

/**
 * Safely sets text content (alias for clarity)
 * @param element - Target DOM element
 * @param text - Text content to set
 */
export function setTextContent(element: HTMLElement, text: string): void {
  element.textContent = text
}

/**
 * Safely sets an attribute value with escaping
 * @param element - Target DOM element
 * @param attribute - Attribute name
 * @param value - Attribute value
 */
export function setSafeAttribute(
  element: HTMLElement,
  attribute: string,
  value: string,
): void {
  element.setAttribute(attribute, escapeHtml(value))
}

/**
 * Creates a safe img element with escaped attributes
 * @param src - Image source URL
 * @param alt - Alt text
 * @param className - Optional CSS classes
 * @returns Safe img element
 */
export function createSafeImage(
  src: string,
  alt: string,
  className?: string,
): HTMLImageElement {
  const img = document.createElement("img")
  img.src = src // URLs are automatically escaped by the browser
  img.alt = escapeHtml(alt)
  if (className) {
    img.className = className
  }
  return img
}
