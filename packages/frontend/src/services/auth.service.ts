import { API_BASE_URL, apiClient } from "./api"

import type { AuthStatus, CurrentUser } from "../types"

export class AuthService {
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
    await apiClient.post("/api/auth/logout")
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

    if (authResult === "success" || authResult === "error") {
      // Clear the query parameter
      window.history.replaceState({}, "", window.location.pathname)
      return authResult
    }

    return null
  }
}

export const authService = new AuthService()
