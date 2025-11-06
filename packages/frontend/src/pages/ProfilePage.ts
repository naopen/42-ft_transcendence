import { Alert } from "../components/Alert"
import { Button } from "../components/Button"
import { Card } from "../components/Card"
import { i18n } from "../i18n"
import { apiClient } from "../services/api"
import { gameService } from "../services/game.service"
import { authStore } from "../stores/auth.store"
import { createSafeImage } from "../utils/sanitize"

import type { GameSession, GameStats, PublicUser } from "../types"

export class ProfilePage {
  private container: HTMLDivElement
  private userId: number
  private user: PublicUser | null = null
  private stats: GameStats | null = null
  private recentGames: GameSession[] = []

  constructor(userId: number) {
    this.userId = userId
    this.container = document.createElement("div")
    this.container.className = "max-w-6xl mx-auto"

    this.loadProfile()
  }

  private async loadProfile(): Promise<void> {
    try {
      // Show loading
      this.renderLoading()

      // Load user profile
      const userResponse = await apiClient.get<{ user: PublicUser }>(
        `/api/users/${this.userId}`,
      )
      this.user = userResponse.user

      // Load stats and game history (requires auth)
      const authState = authStore.getState()
      if (authState.isAuthenticated) {
        try {
          this.stats = await gameService.getUserStats(this.userId)
          const response = await gameService.getUserGameHistory(
            this.userId,
            1,
            10,
          )
          this.recentGames = response.history
        } catch (error) {
          // Stats may not be available for all users
          console.warn("Failed to load stats:", error)
        }
      }

      this.render()
    } catch (error: any) {
      Alert.error(error.message || i18n.t("profile.errors.loadFailed"))
      this.renderError()
    }
  }

  private renderLoading(): void {
    this.container.innerHTML = `
      <div class="text-center py-20">
        <div class="animate-spin inline-block w-12 h-12 border-4 border-42-accent border-t-transparent rounded-full"></div>
        <p class="text-gray-300 mt-4">${i18n.t("profile.loading")}</p>
      </div>
    `
  }

  private renderError(): void {
    this.container.innerHTML = `
      <div class="text-center py-20">
        <p class="text-gray-300 mb-4">${i18n.t("profile.errors.notFound")}</p>
      </div>
    `

    const homeButton = new Button({
      text: i18n.t("profile.backButton"),
      variant: "primary",
      onClick: () => {
        window.dispatchEvent(new CustomEvent("navigate", { detail: "/" }))
      },
    })

    this.container.appendChild(homeButton.getElement())
  }

  private render(): void {
    if (!this.user) {
      return
    }

    this.container.innerHTML = ""

    // Profile Header
    const header = this.createHeader()
    this.container.appendChild(header)

    // Main Grid
    const grid = document.createElement("div")
    grid.className = "grid lg:grid-cols-3 gap-8"

    // Left Column: Stats
    const leftColumn = document.createElement("div")
    leftColumn.className = "lg:col-span-2 space-y-6"

    if (this.stats) {
      leftColumn.appendChild(this.createStatsOverview())
      leftColumn.appendChild(this.createRecentGames())
    } else {
      leftColumn.appendChild(this.createNoStatsMessage())
    }

    grid.appendChild(leftColumn)

    // Right Column: Info
    const rightColumn = document.createElement("div")
    rightColumn.appendChild(this.createUserInfo())
    grid.appendChild(rightColumn)

    this.container.appendChild(grid)
  }

  private createHeader(): HTMLElement {
    const header = document.createElement("div")
    header.className =
      "flex items-center gap-6 mb-8 pb-8 border-b border-gray-800"

    // Avatar
    const avatar = document.createElement("div")
    avatar.className =
      "w-24 h-24 rounded-full bg-42-accent flex items-center justify-center text-4xl"

    if (this.user!.avatar_url) {
      const img = createSafeImage(
        this.user!.avatar_url,
        this.user!.display_name,
        "w-full h-full rounded-full object-cover",
      )
      avatar.appendChild(img)
    } else {
      avatar.textContent = this.user!.display_name.charAt(0).toUpperCase()
    }

    header.appendChild(avatar)

    // User Info
    const info = document.createElement("div")
    info.className = "flex-1"

    const title = document.createElement("h1")
    title.className = "text-4xl font-bold mb-2 text-white"
    title.textContent = this.user!.display_name

    const memberSince = document.createElement("p")
    memberSince.className = "text-gray-400"
    memberSince.textContent = `${i18n.t("profile.memberSince")}: ${new Date(this.user!.created_at).toLocaleDateString()}`

    info.appendChild(title)
    info.appendChild(memberSince)

    header.appendChild(info)

    // View Dashboard Button (if authenticated)
    const authState = authStore.getState()
    if (authState.isAuthenticated && authState.user?.id === this.userId) {
      const dashboardButton = new Button({
        text: i18n.t("profile.viewDashboard"),
        variant: "primary",
        onClick: () => {
          window.dispatchEvent(
            new CustomEvent("navigate", {
              detail: `/dashboard/${this.userId}`,
            }),
          )
        },
      })
      header.appendChild(dashboardButton.getElement())
    }

    return header
  }

  private createStatsOverview(): HTMLElement {
    if (!this.stats) {
      return document.createElement("div")
    }

    const card = new Card({
      title: i18n.t("profile.stats.title"),
      children: "",
    })

    const content = document.createElement("div")
    content.className = "grid grid-cols-2 md:grid-cols-4 gap-4"

    const stats = [
      {
        label: i18n.t("profile.stats.totalGames"),
        value: this.stats.totalGames,
        icon: "🎮",
      },
      {
        label: i18n.t("profile.stats.wins"),
        value: this.stats.wins,
        icon: "🏆",
      },
      {
        label: i18n.t("profile.stats.losses"),
        value: this.stats.losses,
        icon: "❌",
      },
      {
        label: i18n.t("profile.stats.winRate"),
        value: `${this.stats.winRate.toFixed(1)}%`,
        icon: "📊",
      },
    ]

    stats.forEach((stat) => {
      const statDiv = document.createElement("div")
      statDiv.className = "bg-gray-800 p-4 rounded-lg text-center"
      statDiv.innerHTML = `
        <div class="text-3xl mb-2">${stat.icon}</div>
        <div class="text-2xl font-bold text-42-accent mb-1">${stat.value}</div>
        <div class="text-sm text-gray-400">${stat.label}</div>
      `
      content.appendChild(statDiv)
    })

    card.setContent(content)
    return card.getElement()
  }

  private createRecentGames(): HTMLElement {
    const card = new Card({
      title: i18n.t("profile.recentGames.title"),
      children: "",
    })

    if (this.recentGames.length === 0) {
      const noGames = document.createElement("p")
      noGames.className = "text-gray-400 text-center py-8"
      noGames.textContent = i18n.t("profile.recentGames.noGames")
      card.setContent(noGames)
      return card.getElement()
    }

    const content = document.createElement("div")
    content.className = "space-y-3"

    this.recentGames.forEach((game) => {
      const gameDiv = document.createElement("div")
      gameDiv.className =
        "flex items-center justify-between p-4 bg-gray-800 rounded-lg"

      const isWinner = game.winner_id === this.userId
      const resultClass = isWinner ? "text-green-400" : "text-red-400"
      const resultText = isWinner
        ? i18n.t("profile.recentGames.win")
        : i18n.t("profile.recentGames.loss")

      gameDiv.innerHTML = `
        <div class="flex-1">
          <div class="font-bold ${resultClass}">${resultText}</div>
          <div class="text-sm text-gray-400">
            ${game.player1_score} - ${game.player2_score}
          </div>
        </div>
        <div class="text-sm text-gray-500">
          ${new Date(game.completed_at!).toLocaleDateString()}
        </div>
      `

      content.appendChild(gameDiv)
    })

    card.setContent(content)
    return card.getElement()
  }

  private createNoStatsMessage(): HTMLElement {
    const card = new Card({
      title: i18n.t("profile.noStats.title"),
      children: "",
    })

    const content = document.createElement("div")
    content.className = "text-center py-12"
    content.innerHTML = `
      <div class="text-6xl mb-4">📊</div>
      <p class="text-gray-400 mb-6">${i18n.t("profile.noStats.description")}</p>
    `

    const authState = authStore.getState()
    if (!authState.isAuthenticated) {
      const signInButton = new Button({
        text: i18n.t("profile.noStats.signInButton"),
        variant: "primary",
        onClick: () => authStore.login(),
      })
      content.appendChild(signInButton.getElement())
    }

    card.setContent(content)
    return card.getElement()
  }

  private createUserInfo(): HTMLElement {
    const card = new Card({
      title: i18n.t("profile.info.title"),
      children: "",
    })

    const content = document.createElement("div")
    content.className = "space-y-4"

    const info = [
      {
        label: i18n.t("profile.info.displayName"),
        value: this.user!.display_name,
      },
      {
        label: i18n.t("profile.info.joined"),
        value: new Date(this.user!.created_at).toLocaleDateString(),
      },
    ]

    if (this.stats) {
      info.push({
        label: i18n.t("profile.info.totalPoints"),
        value: this.stats.totalPointsScored.toString(),
      })
      info.push({
        label: i18n.t("profile.info.avgDuration"),
        value: `${Math.round(this.stats.avgDuration)}s`,
      })
    }

    info.forEach((item) => {
      const div = document.createElement("div")
      div.className =
        "flex justify-between items-center py-3 border-b border-gray-800"
      div.innerHTML = `
        <span class="text-gray-400">${item.label}</span>
        <span class="font-bold text-white">${item.value}</span>
      `
      content.appendChild(div)
    })

    card.setContent(content)
    return card.getElement()
  }

  getElement(): HTMLDivElement {
    return this.container
  }

  destroy(): void {
    // Cleanup if needed
  }
}
