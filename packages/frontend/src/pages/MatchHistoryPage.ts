import {
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js"
import { format } from "date-fns"

import { Alert } from "../components/Alert"
import { Button } from "../components/Button"
import { Card } from "../components/Card"
import { i18n } from "../i18n"
import { gameService } from "../services/game.service"
import { authStore } from "../stores/auth.store"

import type { GameSessionWithPlayers } from "../types"

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
)

export class MatchHistoryPage {
  private container: HTMLDivElement
  private userId: number
  private gameHistory: GameSessionWithPlayers[] = []
  private currentPage = 1
  private pageSize = 10
  private totalItems = 0
  private selectedMatch: GameSessionWithPlayers | null = null

  constructor(userId: number) {
    this.userId = userId
    this.container = document.createElement("div")
    this.container.className = "max-w-7xl mx-auto"

    this.loadData()
  }

  private async loadData(page = 1): Promise<void> {
    // Wait for auth initialization if still loading
    let authState = authStore.getState()
    if (authState.isLoading) {
      this.renderLoading()
      // Wait for auth to complete by subscribing temporarily
      await new Promise<void>((resolve) => {
        const unsubscribe = authStore.subscribe((state) => {
          if (!state.isLoading) {
            unsubscribe()
            resolve()
          }
        })
      })
      authState = authStore.getState()
    }

    // Check if user can view this history
    if (!authState.isAuthenticated || authState.user?.id !== this.userId) {
      this.renderUnauthorized()
      return
    }

    try {
      this.renderLoading()

      this.currentPage = page
      const response = await gameService.getUserGameHistory(
        this.userId,
        page,
        this.pageSize,
      )

      this.gameHistory = response.history
      this.totalItems = response.pagination.total

      this.render()
    } catch (error: any) {
      console.error("[MatchHistory] Error loading data:", error)
      Alert.error(error.message || i18n.t("matchHistory.errors.loadFailed"))
      this.renderError()
    }
  }

  private renderLoading(): void {
    this.container.innerHTML = `
      <div class="text-center py-20">
        <div class="animate-spin inline-block w-12 h-12 border-4 border-42-accent border-t-transparent rounded-full"></div>
        <p class="text-gray-300 mt-4">${i18n.t("matchHistory.loading")}</p>
      </div>
    `
  }

  private renderUnauthorized(): void {
    this.container.innerHTML = `
      <div class="text-center py-20">
        <div class="text-6xl mb-4">🔒</div>
        <h2 class="text-2xl font-bold mb-4 text-white">${i18n.t("matchHistory.unauthorized.title")}</h2>
        <p class="text-gray-300">${i18n.t("matchHistory.unauthorized.description")}</p>
      </div>
    `
  }

  private renderError(): void {
    this.container.innerHTML = `
      <div class="text-center py-20">
        <p class="text-gray-300">${i18n.t("matchHistory.errors.generic")}</p>
      </div>
    `
  }

  private render(): void {
    this.container.innerHTML = ""

    // Header
    const header = document.createElement("div")
    header.className = "mb-8"
    header.innerHTML = `
      <h1 class="text-4xl font-bold mb-2 text-42-accent">${i18n.t("matchHistory.title")}</h1>
      <p class="text-gray-400">${i18n.t("matchHistory.subtitle")}</p>
    `
    this.container.appendChild(header)

    // No matches message
    if (this.gameHistory.length === 0) {
      const noMatches = document.createElement("div")
      noMatches.className = "text-center py-20"
      noMatches.innerHTML = `
        <div class="text-6xl mb-4">🎮</div>
        <h2 class="text-2xl font-bold mb-2 text-white">${i18n.t("matchHistory.noMatches.title")}</h2>
        <p class="text-gray-400">${i18n.t("matchHistory.noMatches.description")}</p>
      `
      this.container.appendChild(noMatches)
      return
    }

    // Match list
    const matchList = this.createMatchList()
    this.container.appendChild(matchList)

    // Match details modal
    if (this.selectedMatch) {
      const modal = this.createMatchDetailsModal()
      this.container.appendChild(modal)
    }

    // Pagination
    const pagination = this.createPagination()
    this.container.appendChild(pagination)
  }

  private createMatchList(): HTMLElement {
    const listContainer = document.createElement("div")
    listContainer.className = "space-y-4"

    this.gameHistory.forEach((match, index) => {
      const matchCard = this.createMatchCard(match, index)
      listContainer.appendChild(matchCard)
    })

    return listContainer
  }

  private createMatchCard(
    match: GameSessionWithPlayers,
    index: number,
  ): HTMLElement {
    const authState = authStore.getState()
    const currentUserId = authState.user?.id

    // Determine if current user won
    const isWin = match.winner_id === currentUserId
    const isDraw = !match.winner_id
    const resultColor = isDraw
      ? "text-yellow-500"
      : isWin
        ? "text-green-500"
        : "text-red-500"
    const resultIcon = isDraw ? "🤝" : isWin ? "🏆" : "❌"
    const resultText = isDraw
      ? i18n.t("matchHistory.result.draw")
      : isWin
        ? i18n.t("matchHistory.result.win")
        : i18n.t("matchHistory.result.loss")

    // Format date
    const matchDate = match.created_at
      ? format(new Date(match.created_at), "MMM dd, yyyy HH:mm")
      : "Unknown"

    // Calculate duration
    const duration = match.duration
      ? `${Math.floor(match.duration / 60)}:${String(match.duration % 60).padStart(2, "0")}`
      : "N/A"

    // Get player names
    const player1Name = match.player1?.display_name || "Player 1"
    const player2Name = match.player2?.display_name || "Player 2"

    const cardContent = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="text-4xl">${resultIcon}</div>
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="${resultColor} font-bold text-lg">${resultText}</span>
              <span class="text-gray-500 text-sm">•</span>
              <span class="text-gray-400 text-sm">${i18n.t(`matchHistory.gameType.${match.game_type}`)}</span>
            </div>
            <div class="text-gray-300 font-mono text-xl">
              ${player1Name} ${match.player1_score} - ${match.player2_score} ${player2Name}
            </div>
            <div class="text-gray-500 text-sm mt-1">
              ${matchDate} • ${duration}
            </div>
          </div>
        </div>
        <div id="view-details-${index}" class="cursor-pointer"></div>
      </div>
    `

    const card = new Card({
      children: cardContent,
      hover: true,
      className: "transition-all",
    })

    const cardElement = card.getElement()

    // Add view details button
    const viewDetailsContainer = cardElement.querySelector(
      `#view-details-${index}`,
    )
    if (viewDetailsContainer) {
      const viewDetailsBtn = new Button({
        text: i18n.t("matchHistory.viewDetails"),
        variant: "secondary",
        size: "sm",
        onClick: () => {
          this.showMatchDetails(match)
        },
      })
      viewDetailsContainer.appendChild(viewDetailsBtn.getElement())
    }

    return cardElement
  }

  private createMatchDetailsModal(): HTMLElement {
    if (!this.selectedMatch) {
      return document.createElement("div")
    }

    const match = this.selectedMatch
    const authState = authStore.getState()
    const currentUserId = authState.user?.id

    const isWin = match.winner_id === currentUserId
    const isDraw = !match.winner_id

    const modalOverlay = document.createElement("div")
    modalOverlay.className =
      "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
    modalOverlay.onclick = () => {
      this.selectedMatch = null
      this.render()
    }

    const modalContent = document.createElement("div")
    modalContent.className =
      "bg-42-dark rounded-lg p-8 max-w-2xl w-full border border-gray-800"
    modalContent.onclick = (e) => e.stopPropagation()

    // Header
    const header = document.createElement("div")
    header.className = "flex items-center justify-between mb-6"
    header.innerHTML = `
      <h2 class="text-2xl font-bold text-white">${i18n.t("matchHistory.matchDetails.title")}</h2>
      <button id="close-modal" class="text-gray-400 hover:text-white text-2xl">&times;</button>
    `
    modalContent.appendChild(header)

    // Result
    const resultSection = document.createElement("div")
    resultSection.className = "text-center mb-6"
    const resultText = isDraw
      ? i18n.t("matchHistory.result.draw")
      : isWin
        ? i18n.t("matchHistory.result.win")
        : i18n.t("matchHistory.result.loss")
    const resultColor = isDraw
      ? "text-yellow-500"
      : isWin
        ? "text-green-500"
        : "text-red-500"

    // Get player names
    const player1Name = match.player1?.display_name || "Player 1"
    const player2Name = match.player2?.display_name || "Player 2"

    resultSection.innerHTML = `
      <div class="${resultColor} text-3xl font-bold mb-2">${resultText}</div>
      <div class="text-gray-400 text-lg mb-2">
        ${player1Name} vs ${player2Name}
      </div>
      <div class="text-gray-300 font-mono text-4xl mb-4">
        ${match.player1_score} - ${match.player2_score}
      </div>
    `
    modalContent.appendChild(resultSection)

    // Stats Grid
    const statsGrid = document.createElement("div")
    statsGrid.className = "grid grid-cols-2 gap-4 mb-6"

    const stats = [
      {
        label: i18n.t("matchHistory.matchDetails.gameType"),
        value: i18n.t(`matchHistory.gameType.${match.game_type}`),
      },
      {
        label: i18n.t("matchHistory.matchDetails.duration"),
        value: match.duration
          ? `${Math.floor(match.duration / 60)}m ${match.duration % 60}s`
          : "N/A",
      },
      {
        label: i18n.t("matchHistory.matchDetails.date"),
        value: match.created_at
          ? format(new Date(match.created_at), "MMM dd, yyyy")
          : "Unknown",
      },
      {
        label: i18n.t("matchHistory.matchDetails.time"),
        value: match.created_at
          ? format(new Date(match.created_at), "HH:mm:ss")
          : "Unknown",
      },
    ]

    stats.forEach((stat) => {
      const statCard = document.createElement("div")
      statCard.className = "bg-42-darker p-4 rounded-lg border border-gray-800"
      statCard.innerHTML = `
        <div class="text-gray-400 text-sm mb-1">${stat.label}</div>
        <div class="text-white font-semibold">${stat.value}</div>
      `
      statsGrid.appendChild(statCard)
    })

    modalContent.appendChild(statsGrid)

    // Close button event
    const closeBtn = header.querySelector("#close-modal")
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        this.selectedMatch = null
        this.render()
      })
    }

    modalOverlay.appendChild(modalContent)
    return modalOverlay
  }

  private createPagination(): HTMLElement {
    const paginationContainer = document.createElement("div")
    paginationContainer.className =
      "flex justify-center items-center gap-4 mt-8"

    // Calculate total pages
    const totalPages = Math.ceil(this.totalItems / this.pageSize)

    // Previous button
    const prevBtn = new Button({
      text: i18n.t("matchHistory.pagination.previous"),
      variant: "secondary",
      size: "sm",
      disabled: this.currentPage === 1,
      onClick: () => this.loadData(this.currentPage - 1),
    })
    paginationContainer.appendChild(prevBtn.getElement())

    // Page indicator
    const pageIndicator = document.createElement("span")
    pageIndicator.className = "text-gray-300"
    if (totalPages === 0) {
      pageIndicator.textContent = i18n.t("matchHistory.pagination.page", {
        page: 0,
      })
    } else {
      pageIndicator.textContent = `Page ${this.currentPage} of ${totalPages}`
    }
    paginationContainer.appendChild(pageIndicator)

    // Next button
    const nextBtn = new Button({
      text: i18n.t("matchHistory.pagination.next"),
      variant: "secondary",
      size: "sm",
      disabled: this.currentPage >= totalPages || totalPages === 0,
      onClick: () => this.loadData(this.currentPage + 1),
    })
    paginationContainer.appendChild(nextBtn.getElement())

    return paginationContainer
  }

  private showMatchDetails(match: GameSessionWithPlayers): void {
    this.selectedMatch = match
    this.render()
  }

  getElement(): HTMLDivElement {
    return this.container
  }

  destroy(): void {
    // Cleanup if needed
  }
}
