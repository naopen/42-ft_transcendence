import { authService } from "../services/auth.service"

import type { CurrentUser } from "../types"

type AuthStateListener = (state: AuthState) => void

interface AuthState {
  isAuthenticated: boolean
  user: CurrentUser | null
  isLoading: boolean
  error: string | null
}

export class AuthStore {
  private state: AuthState = {
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
  }

  private listeners = new Set<AuthStateListener>()

  constructor() {
    this.initialize()
  }

  /**
   * Initialize auth state
   */
  private async initialize() {
    // Handle OAuth callback
    const oauthResult = authService.handleOAuthCallback()
    if (oauthResult === "error") {
      this.setState({
        isLoading: false,
        error: "Authentication failed. Please try again.",
      })
      return
    }

    // Check authentication status
    try {
      const status = await authService.checkStatus()
      if (status.authenticated) {
        const user = await authService.getCurrentUser()
        this.setState({
          isAuthenticated: true,
          user,
          isLoading: false,
          error: null,
        })
      } else {
        this.setState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: null,
        })
      }
    } catch (error: any) {
      console.error("Failed to check auth status:", error)
      this.setState({
        isLoading: false,
        error: "Failed to check authentication status",
      })
    }
  }

  /**
   * Login with Google OAuth
   */
  login() {
    authService.login()
  }

  /**
   * Logout current user
   */
  async logout() {
    try {
      await authService.logout()
      this.setState({
        isAuthenticated: false,
        user: null,
        error: null,
      })
    } catch (error: any) {
      console.error("Logout failed:", error)
      this.setState({
        error: "Failed to logout",
      })
    }
  }

  /**
   * Get current state
   */
  getState(): AuthState {
    return { ...this.state }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: AuthStateListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Update state and notify listeners
   */
  private setState(updates: Partial<AuthState>) {
    this.state = { ...this.state, ...updates }
    this.notifyListeners()
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.getState()))
  }

  /**
   * Refresh user data
   */
  async refreshUser() {
    if (!this.state.isAuthenticated) {
      return
    }

    try {
      const user = await authService.getCurrentUser()
      this.setState({ user })
    } catch (error: any) {
      console.error("Failed to refresh user:", error)
      // If refresh fails, user might be logged out
      this.setState({
        isAuthenticated: false,
        user: null,
        error: "Session expired",
      })
    }
  }
}

export const authStore = new AuthStore()
