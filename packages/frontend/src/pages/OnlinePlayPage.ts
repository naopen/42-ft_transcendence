import { Alert } from "../components/Alert"
import { Button } from "../components/Button"
import { Card } from "../components/Card"
import { i18n } from "../i18n"
import { socketService } from "../services/socket.service"
import { authStore } from "../stores/auth.store"

type MatchmakingState = "idle" | "searching" | "found"

export class OnlinePlayPage {
  private container: HTMLDivElement
  private matchmakingState: MatchmakingState = "idle"
  private opponent: string | null = null
  private gameRoomId: string | null = null

  constructor() {
    this.container = document.createElement("div")
    this.container.className = "max-w-4xl mx-auto"

    this.checkAuth()
  }

  private checkAuth(): void {
    const authState = authStore.getState()

    if (!authState.isAuthenticated || !authState.user) {
      this.renderSignInRequired()
      return
    }

    // Connect to Socket.IO
    try {
      if (!socketService.isConnected()) {
        socketService.connect(authState.user.id, authState.user.displayName)
      }

      this.setupSocketListeners()
      this.render()
    } catch (error: any) {
      Alert.error(error.message || i18n.t("onlinePlay.errors.connectionFailed"))
      this.renderError()
    }
  }

  private renderSignInRequired(): void {
    this.container.innerHTML = `
      <div class="text-center py-20">
        <div class="text-6xl mb-6">🎮</div>
        <h2 class="text-3xl font-bold mb-4 text-white">
          ${i18n.t("onlinePlay.signInRequired.title")}
        </h2>
        <p class="text-gray-300 mb-8">
          ${i18n.t("onlinePlay.signInRequired.description")}
        </p>
        <div id="sign-in-button"></div>
      </div>
    `

    const signInContainer = this.container.querySelector("#sign-in-button")
    if (signInContainer) {
      const signInBtn = new Button({
        text: i18n.t("onlinePlay.signInRequired.button"),
        variant: "primary",
        size: "lg",
        onClick: () => authStore.login(),
      })
      signInContainer.appendChild(signInBtn.getElement())
    }
  }

  private renderError(): void {
    this.container.innerHTML = `
      <div class="text-center py-20">
        <div class="text-6xl mb-6">❌</div>
        <h2 class="text-3xl font-bold mb-4 text-white">Connection Error</h2>
        <p class="text-gray-300 mb-8">
          ${i18n.t("onlinePlay.errors.connectionFailed")}
        </p>
        <div id="back-button"></div>
      </div>
    `

    const backContainer = this.container.querySelector("#back-button")
    if (backContainer) {
      const backBtn = new Button({
        text: "Back to Home",
        variant: "secondary",
        size: "md",
        onClick: () =>
          window.dispatchEvent(new CustomEvent("navigate", { detail: "/" })),
      })
      backContainer.appendChild(backBtn.getElement())
    }
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="space-y-8">
        <div class="text-center">
          <h1 class="text-4xl font-bold mb-2 text-white">
            ${i18n.t("onlinePlay.title")}
          </h1>
          <p class="text-gray-300">
            ${i18n.t("onlinePlay.subtitle")}
          </p>
        </div>

        <div id="matchmaking-card"></div>
      </div>
    `

    this.renderMatchmakingCard()
  }

  private renderMatchmakingCard(): void {
    const cardContainer = this.container.querySelector("#matchmaking-card")
    if (!cardContainer) {
      return
    }

    let cardContent = ""

    switch (this.matchmakingState) {
      case "idle":
        cardContent = `
          <div class="text-center py-12">
            <div class="text-6xl mb-6">🎯</div>
            <h2 class="text-2xl font-bold mb-4 text-white">
              ${i18n.t("onlinePlay.matchmaking.idle.title")}
            </h2>
            <p class="text-gray-300 mb-8">
              ${i18n.t("onlinePlay.matchmaking.idle.description")}
            </p>
            <div id="find-match-button"></div>
          </div>
        `
        break

      case "searching":
        cardContent = `
          <div class="text-center py-12">
            <div class="animate-pulse text-6xl mb-6">🔍</div>
            <h2 class="text-2xl font-bold mb-4 text-white">
              ${i18n.t("onlinePlay.matchmaking.searching.title")}
            </h2>
            <p class="text-gray-300 mb-4">
              ${i18n.t("onlinePlay.matchmaking.searching.description")}
            </p>
            <div class="flex items-center justify-center gap-2 mb-8">
              <div class="w-2 h-2 bg-42-accent rounded-full animate-bounce" style="animation-delay: 0ms"></div>
              <div class="w-2 h-2 bg-42-accent rounded-full animate-bounce" style="animation-delay: 150ms"></div>
              <div class="w-2 h-2 bg-42-accent rounded-full animate-bounce" style="animation-delay: 300ms"></div>
            </div>
            <div id="cancel-button"></div>
          </div>
        `
        break

      case "found":
        cardContent = `
          <div class="text-center py-12">
            <div class="text-6xl mb-6">✅</div>
            <h2 class="text-2xl font-bold mb-4 text-white">
              ${i18n.t("onlinePlay.matchmaking.found.title")}
            </h2>
            <p class="text-gray-300 mb-2">
              ${i18n.t("onlinePlay.matchmaking.found.description", { opponent: this.opponent || "Unknown" })}
            </p>
            <p class="text-gray-400 text-sm mb-8">
              ${i18n.t("onlinePlay.matchmaking.found.message")}
            </p>
            <div class="flex items-center justify-center gap-2">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span class="text-green-500 text-sm">Connected</span>
            </div>
          </div>
        `
        break
    }

    const card = new Card({ children: cardContent })
    cardContainer.innerHTML = ""
    cardContainer.appendChild(card.getElement())

    // Attach button handlers after rendering
    if (this.matchmakingState === "idle") {
      const findMatchBtn = cardContainer.querySelector("#find-match-button")
      if (findMatchBtn) {
        const btn = new Button({
          text: i18n.t("onlinePlay.matchmaking.idle.button"),
          variant: "primary",
          size: "lg",
          onClick: () => this.startMatchmaking(),
        })
        findMatchBtn.appendChild(btn.getElement())
      }
    } else if (this.matchmakingState === "searching") {
      const cancelBtn = cardContainer.querySelector("#cancel-button")
      if (cancelBtn) {
        const btn = new Button({
          text: i18n.t("onlinePlay.matchmaking.searching.cancelButton"),
          variant: "secondary",
          size: "md",
          onClick: () => this.cancelMatchmaking(),
        })
        cancelBtn.appendChild(btn.getElement())
      }
    }
  }

  private setupSocketListeners(): void {
    // Queue joined
    socketService.on("queueJoined", () => {
      console.log("[OnlinePlay] Joined queue")
      this.matchmakingState = "searching"
      this.renderMatchmakingCard()
    })

    // Queue left
    socketService.on("queueLeft", () => {
      console.log("[OnlinePlay] Left queue")
      this.matchmakingState = "idle"
      this.renderMatchmakingCard()
    })

    // Match found
    socketService.on("matchFound", (data) => {
      console.log("[OnlinePlay] Match found:", data)
      this.matchmakingState = "found"
      this.opponent = data.opponentName
      this.gameRoomId = data.gameRoomId
      this.renderMatchmakingCard()

      // Navigate to game page after a short delay
      setTimeout(() => {
        // Use SPA navigation to avoid disconnecting Socket.IO
        window.dispatchEvent(
          new CustomEvent("navigate", {
            detail: `/game/online/${this.gameRoomId}`,
          }),
        )
      }, 2000)
    })

    // Error
    socketService.on("error", (data) => {
      console.error("[OnlinePlay] Socket error:", data.message)
      Alert.error(data.message)
      this.matchmakingState = "idle"
      this.renderMatchmakingCard()
    })

    // Connection status
    socketService.on("connected", (data) => {
      console.log("[OnlinePlay] Connected as:", data.userName)
    })

    // Opponent disconnected
    socketService.on("opponentDisconnected", () => {
      console.log("[OnlinePlay] Opponent disconnected")
      Alert.info("Opponent disconnected")
      this.matchmakingState = "idle"
      this.renderMatchmakingCard()
    })
  }

  private startMatchmaking(): void {
    try {
      socketService.joinQueue()
      console.log("[OnlinePlay] Starting matchmaking...")
    } catch (error: any) {
      console.error("[OnlinePlay] Error starting matchmaking:", error)
      Alert.error(
        error.message || i18n.t("onlinePlay.errors.matchmakingFailed"),
      )
    }
  }

  private cancelMatchmaking(): void {
    try {
      socketService.leaveQueue()
      console.log("[OnlinePlay] Cancelled matchmaking")
    } catch (error: any) {
      console.error("[OnlinePlay] Error cancelling matchmaking:", error)
    }
  }

  public getElement(): HTMLDivElement {
    return this.container
  }

  public destroy(): void {
    // Clean up socket listeners
    socketService.off("queueJoined")
    socketService.off("queueLeft")
    socketService.off("matchFound")
    socketService.off("error")
    socketService.off("connected")
    socketService.off("opponentDisconnected")

    // Leave queue if still searching
    if (this.matchmakingState === "searching") {
      socketService.leaveQueue()
    }
  }
}
