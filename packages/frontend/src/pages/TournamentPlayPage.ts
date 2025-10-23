import { GamePage } from "./GamePage"
import { Alert } from "../components/Alert"
import { Button } from "../components/Button"
import { Card } from "../components/Card"
import { i18n } from "../i18n"
import { gameService } from "../services/game.service"
import { tournamentStore } from "../stores/tournament.store"

import type { TournamentMatch, TournamentParticipant } from "../types"

export class TournamentPlayPage {
  private container: HTMLDivElement
  private tournamentId: number
  private unsubscribe?: () => void
  private currentMatch: TournamentMatch | null = null
  private gamePage: GamePage | null = null
  private isInGame = false

  constructor(tournamentId: number) {
    this.tournamentId = tournamentId
    this.container = document.createElement("div")
    this.container.className = "max-w-7xl mx-auto"

    // Subscribe to tournament store
    this.unsubscribe = tournamentStore.subscribe(() => {
      if (!this.isInGame) {
        this.render()
      }
    })

    // Load tournament data
    this.loadTournament()
  }

  private async loadTournament(): Promise<void> {
    try {
      await tournamentStore.loadTournamentDetails(this.tournamentId)
      this.render()
    } catch (error: any) {
      Alert.error(error.message || i18n.t("tournament.play.errors.loadFailed"))
    }
  }

  private render(): void {
    const state = tournamentStore.getState()

    if (state.isLoading && !state.currentTournament) {
      this.container.innerHTML = `
        <div class="text-center py-20">
          <div class="animate-spin inline-block w-12 h-12 border-4 border-42-accent border-t-transparent rounded-full"></div>
          <p class="text-gray-300 mt-4">${i18n.t("tournament.play.loading")}</p>
        </div>
      `
      return
    }

    if (!state.currentTournament) {
      this.container.innerHTML = `
        <div class="text-center py-20">
          <p class="text-gray-300">${i18n.t("tournament.play.errors.notFound")}</p>
        </div>
      `
      return
    }

    const { tournament, participants, matches, currentMatch } =
      state.currentTournament

    this.currentMatch = currentMatch

    this.container.innerHTML = ""

    // Header
    const header = document.createElement("div")
    header.className = "mb-8"
    header.innerHTML = `
      <h1 class="text-4xl font-bold mb-2 text-42-accent">${tournament.name}</h1>
      <div class="flex items-center gap-4 text-gray-400">
        <span>${i18n.t(`tournament.status.${tournament.status}`)}</span>
        <span>•</span>
        <span>${participants.length} ${i18n.t("tournament.play.players")}</span>
      </div>
    `
    this.container.appendChild(header)

    // Main Content Grid
    const grid = document.createElement("div")
    grid.className = "grid lg:grid-cols-3 gap-8"

    // Left Column: Current Match & Actions
    const leftColumn = document.createElement("div")
    leftColumn.className = "lg:col-span-2 space-y-6"

    // Tournament Status
    if (tournament.status === "pending") {
      leftColumn.appendChild(this.createPendingStatus())
    } else if (tournament.status === "completed") {
      leftColumn.appendChild(this.createCompletedStatus(participants))
    } else if (currentMatch) {
      leftColumn.appendChild(
        this.createCurrentMatch(currentMatch, participants),
      )
    }

    // Bracket Display
    leftColumn.appendChild(this.createBracket(matches, participants))

    grid.appendChild(leftColumn)

    // Right Column: Participants List
    const rightColumn = document.createElement("div")
    rightColumn.appendChild(this.createParticipantsList(participants))
    grid.appendChild(rightColumn)

    this.container.appendChild(grid)
  }

  private createPendingStatus(): HTMLElement {
    const card = new Card({
      title: i18n.t("tournament.play.pending.title"),
      children: "",
    })

    const content = document.createElement("div")
    content.className = "text-center py-8"

    const description = document.createElement("p")
    description.className = "text-gray-400 mb-6"
    description.textContent = i18n.t("tournament.play.pending.description")
    content.appendChild(description)

    const startButton = new Button({
      text: i18n.t("tournament.play.pending.startButton"),
      variant: "primary",
      size: "lg",
      onClick: () => this.startTournament(),
    })
    content.appendChild(startButton.getElement())

    card.setContent(content)
    return card.getElement()
  }

  private createCompletedStatus(
    participants: TournamentParticipant[],
  ): HTMLElement {
    const winner = participants.find((p) => p.position === 1)

    const card = document.createElement("div")
    card.className =
      "bg-gradient-to-r from-yellow-900 to-42-dark p-8 rounded-lg border border-yellow-500 text-center"

    card.innerHTML = `
      <div class="text-6xl mb-4">🏆</div>
      <h2 class="text-3xl font-bold mb-2 text-white">
        ${i18n.t("tournament.play.completed.title")}
      </h2>
      <p class="text-xl text-yellow-300 mb-6">
        ${i18n.t("tournament.play.completed.winner")}: <span class="font-bold">${winner?.alias || "Unknown"}</span>
      </p>
    `

    const homeButton = new Button({
      text: i18n.t("tournament.play.completed.homeButton"),
      variant: "primary",
      onClick: () => {
        window.dispatchEvent(new CustomEvent("navigate", { detail: "/" }))
      },
    })
    card.appendChild(homeButton.getElement())

    return card
  }

  private createCurrentMatch(
    match: TournamentMatch,
    participants: TournamentParticipant[],
  ): HTMLElement {
    const player1 = participants.find((p) => p.id === match.participant1_id)
    const player2 = participants.find((p) => p.id === match.participant2_id)

    const card = new Card({
      title: `${i18n.t("tournament.play.currentMatch.title")} - ${i18n.t("tournament.play.round")} ${match.round}`,
      children: "",
    })

    const content = document.createElement("div")
    content.className = "space-y-6"

    // VS Display
    const vsDisplay = document.createElement("div")
    vsDisplay.className = "grid grid-cols-3 gap-4 items-center text-center py-6"
    vsDisplay.innerHTML = `
      <div class="bg-gray-800 p-6 rounded-lg">
        <div class="text-3xl mb-2">👤</div>
        <p class="text-xl font-bold text-white">${player1?.alias || "Unknown"}</p>
      </div>
      <div class="text-4xl font-bold text-42-accent">VS</div>
      <div class="bg-gray-800 p-6 rounded-lg">
        <div class="text-3xl mb-2">👤</div>
        <p class="text-xl font-bold text-white">${player2?.alias || "Unknown"}</p>
      </div>
    `
    content.appendChild(vsDisplay)

    // Play Button
    const playButton = new Button({
      text: i18n.t("tournament.play.currentMatch.playButton"),
      variant: "primary",
      size: "lg",
      onClick: () => this.startMatch(match, player1!, player2!),
    })

    const buttonContainer = document.createElement("div")
    buttonContainer.className = "flex justify-center"
    buttonContainer.appendChild(playButton.getElement())
    content.appendChild(buttonContainer)

    card.setContent(content)
    return card.getElement()
  }

  private createBracket(
    matches: TournamentMatch[],
    participants: TournamentParticipant[],
  ): HTMLElement {
    const card = new Card({
      title: i18n.t("tournament.play.bracket.title"),
      children: "",
    })

    const content = document.createElement("div")
    content.className = "space-y-6"

    // Group matches by round
    const maxRound = Math.max(...matches.map((m) => m.round), 0)

    for (let round = 1; round <= maxRound; round++) {
      const roundMatches = matches.filter((m) => m.round === round)

      if (roundMatches.length === 0) {
        continue
      }

      const roundDiv = document.createElement("div")
      roundDiv.className = "space-y-3"

      const roundTitle = document.createElement("h3")
      roundTitle.className = "text-lg font-bold text-42-accent"
      roundTitle.textContent = `${i18n.t("tournament.play.round")} ${round}`
      roundDiv.appendChild(roundTitle)

      const matchesContainer = document.createElement("div")
      matchesContainer.className = "grid md:grid-cols-2 gap-3"

      roundMatches.forEach((match) => {
        const matchDiv = this.createMatchCard(match, participants)
        matchesContainer.appendChild(matchDiv)
      })

      roundDiv.appendChild(matchesContainer)
      content.appendChild(roundDiv)
    }

    card.setContent(content)
    return card.getElement()
  }

  private createMatchCard(
    match: TournamentMatch,
    participants: TournamentParticipant[],
  ): HTMLElement {
    const player1 = participants.find((p) => p.id === match.participant1_id)
    const player2 = participants.find((p) => p.id === match.participant2_id)

    const div = document.createElement("div")
    div.className = `bg-gray-800 p-3 rounded border ${
      match.status === "completed"
        ? "border-green-500"
        : match.status === "in_progress"
          ? "border-42-accent"
          : "border-gray-700"
    }`

    const isWinner1 = match.winner_id === match.participant1_id
    const isWinner2 = match.winner_id === match.participant2_id

    div.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm ${isWinner1 ? "text-green-400 font-bold" : "text-gray-400"}">${player1?.alias || "TBD"}</span>
        ${isWinner1 ? '<span class="text-green-400">✓</span>' : ""}
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm ${isWinner2 ? "text-green-400 font-bold" : "text-gray-400"}">${player2?.alias || "TBD"}</span>
        ${isWinner2 ? '<span class="text-green-400">✓</span>' : ""}
      </div>
    `

    return div
  }

  private createParticipantsList(
    participants: TournamentParticipant[],
  ): HTMLElement {
    const card = new Card({
      title: i18n.t("tournament.play.participants.title"),
      children: "",
    })

    const content = document.createElement("div")
    content.className = "space-y-2"

    participants.forEach((participant) => {
      const div = document.createElement("div")
      div.className = `flex items-center justify-between p-3 rounded ${
        participant.eliminated_at ? "bg-gray-800 opacity-50" : "bg-gray-800"
      }`

      div.innerHTML = `
        <span class="font-medium ${participant.eliminated_at ? "line-through text-gray-500" : "text-white"}">
          ${participant.alias}
        </span>
        ${participant.position === 1 ? '<span class="text-2xl">🏆</span>' : ""}
        ${participant.eliminated_at && participant.position !== 1 ? '<span class="text-red-500">✕</span>' : ""}
      `

      content.appendChild(div)
    })

    card.setContent(content)
    return card.getElement()
  }

  private async startTournament(): Promise<void> {
    try {
      await tournamentStore.startTournament(this.tournamentId)
      Alert.success(i18n.t("tournament.play.messages.started"))
    } catch (error: any) {
      Alert.error(error.message || i18n.t("tournament.play.errors.startFailed"))
    }
  }

  private async startMatch(
    match: TournamentMatch,
    player1: TournamentParticipant,
    player2: TournamentParticipant,
  ): Promise<void> {
    // Start the 3D Pong game
    this.isInGame = true

    // Clear container and show game
    this.container.innerHTML = ""

    // Create game page
    this.gamePage = new GamePage({
      player1Name: player1.alias,
      player2Name: player2.alias,
      maxScore: 11,
      onGameEnd: (winner, p1Score, p2Score) => {
        this.handleGameEnd(match, player1, player2, winner, p1Score, p2Score)
      },
    })

    this.container.appendChild(this.gamePage.getElement())
  }

  private async handleGameEnd(
    match: TournamentMatch,
    player1: TournamentParticipant,
    player2: TournamentParticipant,
    winner: 1 | 2,
    player1Score: number,
    player2Score: number,
  ): Promise<void> {
    try {
      // Create a game session
      const gameSession = await gameService.createGameSession("tournament")

      // Complete the game session
      const completedSession = await gameService.completeGameSession(
        gameSession.id,
        player1Score,
        player2Score,
        120, // Duration (will be replaced with actual duration later)
      )

      // Determine winner participant ID
      const winnerId = winner === 1 ? player1.id : player2.id

      // Complete the tournament match
      await tournamentStore.completeMatch(
        this.tournamentId,
        match.id,
        winnerId,
        completedSession.id,
      )

      Alert.success(i18n.t("tournament.play.messages.matchCompleted"))

      // Clean up game
      if (this.gamePage) {
        this.gamePage.destroy()
        this.gamePage = null
      }

      // Return to tournament view
      this.isInGame = false
      this.render()
    } catch (error: any) {
      Alert.error(
        error.message || i18n.t("tournament.play.errors.completeFailed"),
      )
    }
  }

  getElement(): HTMLDivElement {
    return this.container
  }

  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe()
    }

    if (this.gamePage) {
      this.gamePage.destroy()
    }
  }
}
