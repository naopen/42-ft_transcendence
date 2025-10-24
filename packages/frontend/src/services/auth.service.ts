import { API_BASE_URL, apiClient } from "./api"

import type { AuthStatus, CurrentUser } from "../types"

const TOKEN_STORAGE_KEY = "ft_transcendence_token"

export class AuthService {
  /**
   * Get stored authentication token
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  }

  /**
   * Store authentication token
   */
  private setToken(token: string): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  }

  /**
   * Clear stored authentication token
   */
  private clearToken(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }

  /**
   * Redirect to Google OAuth login
   */
  login(): void {
    window.location.href = `${API_BASE_URL}/api/auth/google`
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post("/api/auth/logout")
    } finally {
      // Always clear token even if API call fails
      this.clearToken()
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<CurrentUser> {
    return apiClient.get<CurrentUser>("/api/auth/me")
  }

  /**
   * Check authentication status
   */
  async checkStatus(): Promise<AuthStatus> {
    return apiClient.get<AuthStatus>("/api/auth/status")
  }

  /**
   * Handle OAuth callback result
   */
  handleOAuthCallback(): "success" | "error" | null {
    const params = new URLSearchParams(window.location.search)
    const authResult = params.get("auth")
    const token = params.get("token")

    if (authResult === "success" && token) {
      // Store the JWT token
      this.setToken(token)
      // Clear the query parameters
      window.history.replaceState({}, "", window.location.pathname)
      return "success"
    }

    if (authResult === "error") {
      // Clear the query parameter
      window.history.replaceState({}, "", window.location.pathname)
      return "error"
    }

    return null
  }
}

export const authService = new AuthService()
