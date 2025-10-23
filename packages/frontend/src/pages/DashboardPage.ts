import {
  ArcElement,
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

import { Alert } from "../components/Alert"
import { Card } from "../components/Card"
import { i18n } from "../i18n"
import { gameService } from "../services/game.service"
import { authStore } from "../stores/auth.store"

import type { GameSession, GameStats } from "../types"

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
)

export class DashboardPage {
  private container: HTMLDivElement
  private userId: number
  private stats: GameStats | null = null
  private gameHistory: GameSession[] = []

  constructor(userId: number) {
    this.userId = userId
    this.container = document.createElement("div")
    this.container.className = "max-w-7xl mx-auto"

    this.loadData()
  }

  private async loadData(): Promise<void> {
    const authState = authStore.getState()

    // Check if user can view this dashboard
    if (!authState.isAuthenticated || authState.user?.id !== this.userId) {
      this.renderUnauthorized()
      return
    }

    try {
      this.renderLoading()

      // Load stats and history
      this.stats = await gameService.getUserStats(this.userId)
      this.gameHistory = await gameService.getUserGameHistory(
        this.userId,
        1,
        50,
      )

      this.render()
    } catch (error: any) {
      Alert.error(error.message || i18n.t("dashboard.errors.loadFailed"))
      this.renderError()
    }
  }

  private renderLoading(): void {
    this.container.innerHTML = `
      <div class="text-center py-20">
        <div class="animate-spin inline-block w-12 h-12 border-4 border-42-accent border-t-transparent rounded-full"></div>
        <p class="text-gray-300 mt-4">${i18n.t("dashboard.loading")}</p>
      </div>
    `
  }

  private renderUnauthorized(): void {
    this.container.innerHTML = `
      <div class="text-center py-20">
        <div class="text-6xl mb-4">🔒</div>
        <h2 class="text-2xl font-bold mb-4 text-white">${i18n.t("dashboard.unauthorized.title")}</h2>
        <p class="text-gray-300">${i18n.t("dashboard.unauthorized.description")}</p>
      </div>
    `
  }

  private renderError(): void {
    this.container.innerHTML = `
      <div class="text-center py-20">
        <p class="text-gray-300">${i18n.t("dashboard.errors.generic")}</p>
      </div>
    `
  }

  private render(): void {
    if (!this.stats) {
      return
    }

    this.container.innerHTML = ""

    // Header
    const header = document.createElement("div")
    header.className = "mb-8"
    header.innerHTML = `
      <h1 class="text-4xl font-bold mb-2 text-42-accent">${i18n.t("dashboard.title")}</h1>
      <p class="text-gray-400">${i18n.t("dashboard.subtitle")}</p>
    `
    this.container.appendChild(header)

    // Stats Overview Cards
    const statsGrid = this.createStatsGrid()
    this.container.appendChild(statsGrid)

    // Charts Grid
    const chartsGrid = document.createElement("div")
    chartsGrid.className = "grid lg:grid-cols-2 gap-8 mb-8"

    // Win/Loss Chart
    chartsGrid.appendChild(this.createWinLossChart())

    // Performance Chart
    chartsGrid.appendChild(this.createPerformanceChart())

    this.container.appendChild(chartsGrid)

    // Game History Table
    const historySection = this.createGameHistoryTable()
    this.container.appendChild(historySection)
  }

  private createStatsGrid(): HTMLElement {
    const grid = document.createElement("div")
    grid.className = "grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"

    const stats = [
      {
        label: i18n.t("dashboard.stats.totalGames"),
        value: this.stats!.totalGames,
        icon: "🎮",
        color: "bg-blue-900",
      },
      {
        label: i18n.t("dashboard.stats.winRate"),
        value: `${this.stats!.winRate.toFixed(1)}%`,
        icon: "🏆",
        color: "bg-green-900",
      },
      {
        label: i18n.t("dashboard.stats.totalPoints"),
        value: this.stats!.totalPointsScored,
        icon: "⚡",
        color: "bg-yellow-900",
      },
      {
        label: i18n.t("dashboard.stats.avgDuration"),
        value: `${Math.round(this.stats!.avgDuration)}s`,
        icon: "⏱️",
        color: "bg-purple-900",
      },
    ]

    stats.forEach((stat) => {
      const card = document.createElement("div")
      card.className = `${stat.color} p-6 rounded-lg border border-gray-800 text-center hover:scale-105 transition-transform`
      card.innerHTML = `
        <div class="text-4xl mb-3">${stat.icon}</div>
        <div class="text-3xl font-bold text-white mb-2">${stat.value}</div>
        <div class="text-sm text-gray-300">${stat.label}</div>
      `
      grid.appendChild(card)
    })

    return grid
  }

  private createWinLossChart(): HTMLElement {
    const card = new Card({
      title: i18n.t("dashboard.charts.winLoss.title"),
      children: "",
    })

    const canvas = document.createElement("canvas")
    canvas.id = "win-loss-chart"

    setTimeout(() => {
      new Chart(canvas, {
        type: "doughnut",
        data: {
          labels: [
            i18n.t("dashboard.charts.winLoss.wins"),
            i18n.t("dashboard.charts.winLoss.losses"),
            i18n.t("dashboard.charts.winLoss.draws"),
          ],
          datasets: [
            {
              data: [this.stats!.wins, this.stats!.losses, this.stats!.draws],
              backgroundColor: ["#00babc", "#ef4444", "#6b7280"],
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: "#d1d5db",
                padding: 15,
              },
            },
          },
        },
      })
    }, 100)

    card.setContent(canvas)
    return card.getElement()
  }

  private createPerformanceChart(): HTMLElement {
    const card = new Card({
      title: i18n.t("dashboard.charts.performance.title"),
      children: "",
    })

    const canvas = document.createElement("canvas")
    canvas.id = "performance-chart"

    // Prepare data from game history (last 10 games)
    const recentGames = this.gameHistory.slice(0, 10).reverse()
    const labels = recentGames.map((_, index) =>
      i18n.t("dashboard.charts.performance.game", { number: index + 1 }),
    )
    const scores = recentGames.map((game) => {
      if (game.player1_id === this.userId) {
        return game.player1_score
      }
      return game.player2_score
    })

    setTimeout(() => {
      new Chart(canvas, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: i18n.t("dashboard.charts.performance.pointsScored"),
              data: scores,
              borderColor: "#00babc",
              backgroundColor: "rgba(0, 186, 188, 0.1)",
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              labels: {
                color: "#d1d5db",
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: "#9ca3af",
              },
              grid: {
                color: "rgba(75, 85, 99, 0.2)",
              },
            },
            x: {
              ticks: {
                color: "#9ca3af",
              },
              grid: {
                color: "rgba(75, 85, 99, 0.2)",
              },
            },
          },
        },
      })
    }, 100)

    card.setContent(canvas)
    return card.getElement()
  }

  private createGameHistoryTable(): HTMLElement {
    const card = new Card({
      title: i18n.t("dashboard.history.title"),
      children: "",
    })

    if (this.gameHistory.length === 0) {
      const noGames = document.createElement("p")
      noGames.className = "text-gray-400 text-center py-8"
      noGames.textContent = i18n.t("dashboard.history.noGames")
      card.setContent(noGames)
      return card.getElement()
    }

    const table = document.createElement("div")
    table.className = "overflow-x-auto"

    const tableElement = document.createElement("table")
    tableElement.className = "w-full text-left"

    // Table Header
    tableElement.innerHTML = `
      <thead class="border-b border-gray-700">
        <tr>
          <th class="pb-3 text-gray-400">${i18n.t("dashboard.history.columns.date")}</th>
          <th class="pb-3 text-gray-400">${i18n.t("dashboard.history.columns.result")}</th>
          <th class="pb-3 text-gray-400">${i18n.t("dashboard.history.columns.score")}</th>
          <th class="pb-3 text-gray-400">${i18n.t("dashboard.history.columns.duration")}</th>
          <th class="pb-3 text-gray-400">${i18n.t("dashboard.history.columns.type")}</th>
        </tr>
      </thead>
    `

    const tbody = document.createElement("tbody")

    this.gameHistory.forEach((game) => {
      const isWinner = game.winner_id === this.userId
      const isDraw = !game.winner_id
      const resultClass = isWinner
        ? "text-green-400"
        : isDraw
          ? "text-gray-400"
          : "text-red-400"
      const resultText = isWinner
        ? i18n.t("dashboard.history.win")
        : isDraw
          ? i18n.t("dashboard.history.draw")
          : i18n.t("dashboard.history.loss")

      const row = document.createElement("tr")
      row.className = "border-b border-gray-800"
      row.innerHTML = `
        <td class="py-3 text-gray-300">
          ${new Date(game.completed_at!).toLocaleDateString()}
        </td>
        <td class="py-3">
          <span class="font-bold ${resultClass}">${resultText}</span>
        </td>
        <td class="py-3 text-gray-300">
          ${game.player1_score} - ${game.player2_score}
        </td>
        <td class="py-3 text-gray-300">
          ${game.duration}s
        </td>
        <td class="py-3 text-gray-400">
          ${i18n.t(`dashboard.history.gameType.${game.game_type}`)}
        </td>
      `

      tbody.appendChild(row)
    })

    tableElement.appendChild(tbody)
    table.appendChild(tableElement)

    card.setContent(table)
    return card.getElement()
  }

  getElement(): HTMLDivElement {
    return this.container
  }

  destroy(): void {
    // Cleanup charts if needed
    Chart.getChart("win-loss-chart")?.destroy()
    Chart.getChart("performance-chart")?.destroy()
  }
}
