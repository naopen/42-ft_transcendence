// API Configuration
// Detect if we're on HTTPS and construct the backend URL accordingly
let API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

// In production, use HTTPS if the frontend is served over HTTPS
if (typeof window !== "undefined" && window.location.protocol === "https:") {
  API_BASE_URL = API_BASE_URL.replace(/^http:/, "https:")
}

// Export API_BASE_URL for use in other modules
export { API_BASE_URL }

export interface ApiError {
  code: string
  message: string
  statusCode: number
}

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    // Build headers - only set Content-Type if there's a body
    const headers: Record<string, string> = {}

    if (options.body) {
      headers["Content-Type"] = "application/json"
    }

    // Merge headers properly
    const mergedHeaders: Record<string, string> = { ...headers }
    if (options.headers) {
      const optHeaders = options.headers as Record<string, string>
      Object.assign(mergedHeaders, optHeaders)
    }

    const config: RequestInit = {
      ...options,
      credentials: "include", // Important for session cookies
      headers: mergedHeaders,
    }

    try {
      const response = await fetch(url, config)

      // Handle non-JSON responses
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        return {} as T
      }

      const data = await response.json()

      if (!response.ok) {
        throw {
          code: data.error?.code || "UNKNOWN_ERROR",
          message: data.error?.message || "An error occurred",
          statusCode: response.status,
        } as ApiError
      }

      return data as T
    } catch (error) {
      if ((error as ApiError).code) {
        throw error
      }
      throw {
        code: "NETWORK_ERROR",
        message: "Failed to connect to server",
        statusCode: 0,
      } as ApiError
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.fetch<T>(endpoint, { method: "GET" })
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.fetch<T>(endpoint, { method: "DELETE" })
  }
}

export const apiClient = new ApiClient()
