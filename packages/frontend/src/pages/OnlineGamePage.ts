import { Button } from "../components/Button"
import { Modal } from "../components/Modal"
import { PongEngine } from "../game/PongEngine"
import { i18n } from "../i18n"
import { socketService } from "../services/socket.service"
import { authStore } from "../stores/auth.store"
import { getOptimalCanvasSize, isMobileDevice } from "../utils/mobile"

export class OnlineGamePage {
  private container: HTMLDivElement
  private canvas: HTMLCanvasElement
  private engine: PongEngine | null = null
  private roomId: string
  private isPlayer1 = false
  private player1Name = ""
  private player2Name = ""
  private paddleUpdateInterval: number | null = null
  private countdownValue = 3
  private isMobile: boolean
  private mobileControls: HTMLDivElement | null = null

  constructor(roomId: string) {
    this.roomId = roomId
    this.isMobile = isMobileDevice()
    this.container = document.createElement("div")
    this.container.className = "max-w-7xl mx-auto px-2 sm:px-4"

    // Create canvas with responsive size
    this.canvas = document.createElement("canvas")
    this.canvas.id = "game-canvas"
    this.canvas.className = "w-full rounded-lg shadow-2xl"

    // Set initial canvas size
    const canvasSize = getOptimalCanvasSize(
      this.isMobile ? window.innerWidth : 1280,
      this.isMobile ? window.innerHeight * 0.5 : 720,
    )
    this.canvas.width = canvasSize.width
    this.canvas.height = canvasSize.height

    // Handle window resize for responsive canvas
    window.addEventListener("resize", () => this.handleResize())

    // Initialize asynchronously
    this.initialize()
  }

  private handleResize(): void {
    const canvasSize = getOptimalCanvasSize(
      this.isMobile ? window.innerWidth : 1280,
      this.isMobile ? window.innerHeight * 0.5 : 720,
    )
    this.canvas.width = canvasSize.width
    this.canvas.height = canvasSize.height
  }

  private async initialize(): Promise<void> {
    // Wait for auth initialization if still loading
    let authState = authStore.getState()
    if (authState.isLoading) {
      // Show loading state
      this.container.innerHTML = `
        <div class="text-center py-20">
          <div class="animate-spin inline-block w-12 h-12 border-4 border-42-accent border-t-transparent rounded-full"></div>
          <p class="text-gray-300 mt-4">Loading...</p>
        </div>
      `
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

    // Check authentication
    if (!authState.isAuthenticated || !authState.user) {
      this.showError("You must be logged in to play online")
      return
    }

    // Setup Socket.IO connection
    this.setupSocketConnection(authState.user.id, authState.user.displayName)
  }

  private async setupSocketConnection(
    userId: number,
    userName: string,
  ): Promise<void> {
    try {
      // CRITICAL: Use promise-based connection with state machine
      await socketService.connect(userId, userName)

      console.log("[OnlineGamePage] Connected to server, sending ready signal")

      // Send ready signal after successful connection
      socketService.sendReady()

      // Preparation phase start
      socketService.on("startPreparation", (data) => {
        console.log("[OnlineGamePage] Preparation phase starting:", data)
        this.isPlayer1 = data.isPlayer1
        this.player1Name = data.player1Name
        this.player2Name = data.player2Name
        this.renderPreparationScreen()
      })

      // Countdown event
      socketService.on("countdown", (data) => {
        console.log("[OnlineGamePage] Countdown:", data.count)
        this.countdownValue = data.count
        this.updateCountdownDisplay()
      })

      // Game start event
      socketService.on("gameStart", (data) => {
        console.log("[OnlineGamePage] Game starting:", data)
        this.isPlayer1 = data.isPlayer1
        this.player1Name = data.player1Name
        this.player2Name = data.player2Name
        this.startGame()
      })

      // Game state updates from server
      socketService.on("gameState", (state) => {
        if (this.engine) {
          this.engine.updateFromServer(state)
        }
      })

      // Score updates
      socketService.on("scoreUpdate", (data) => {
        console.log("[OnlineGamePage] Score update:", data)
      })

      // Game end
      socketService.on("gameEnd", (data) => {
        console.log("[OnlineGamePage] Game ended:", data)
        if (this.engine) {
          // Update engine state with final scores
          this.engine.handleServerGameEnd(data.winnerId, data.finalScore)
          // Note: cleanup() will be called when modal is closed
        }
      })

      // Opponent disconnected
      socketService.on("opponentDisconnected", () => {
        this.showError("Opponent disconnected")
        this.cleanup()
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("navigate", { detail: "/" }))
        }, 3000)
      })

      // Error handling
      socketService.on("error", (data) => {
        this.showError(data.message)
      })

      // Render waiting screen
      this.renderWaitingScreen()
    } catch (error) {
      console.error("[OnlineGamePage] Socket connection error:", error)
      this.showError("Failed to connect to game server")
    }
  }

  private startGame(): void {
    console.log("[OnlineGamePage] Starting game engine...")

    // Create game engine in online mode
    this.engine = new PongEngine({
      canvas: this.canvas,
      player1Name: this.player1Name,
      player2Name: this.player2Name,
      mode: "online",
      isPlayer1: this.isPlayer1,
      maxScore: 11,
      onScoreUpdate: (p1Score, p2Score) => this.updateScore(p1Score, p2Score),
      onGameEnd: (winnerId: 1 | 2) => {
        // Show game end modal with winner info
        this.showGameEndModal(winnerId)
      },
    })

    this.engine.start()
    this.renderGameScreen()

    // Start sending paddle position to server
    this.startPaddleUpdates()
  }

  private startPaddleUpdates(): void {
    // Send paddle position to server every 50ms (20fps for input)
    this.paddleUpdateInterval = window.setInterval(() => {
      if (this.engine) {
        const paddleX = this.engine.getCurrentPaddlePosition()
        socketService.sendPaddleMove(paddleX)
      }
    }, 50)
  }

  private updateScore(player1Score: number, player2Score: number): void {
    const p1ScoreEl = document.getElementById("player1-score")
    const p2ScoreEl = document.getElementById("player2-score")

    if (p1ScoreEl) {
      p1ScoreEl.textContent = player1Score.toString()
    }
    if (p2ScoreEl) {
      p2ScoreEl.textContent = player2Score.toString()
    }
  }

  private renderWaitingScreen(): void {
    this.container.innerHTML = `
      <div class="text-center py-20">
        <div class="text-6xl mb-6">⏳</div>
        <h2 class="text-3xl font-bold mb-4 text-white">Waiting for game to start...</h2>
        <p class="text-gray-300 mb-8">Connecting to game room...</p>
        <div class="flex justify-center">
          <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-42-accent"></div>
        </div>
      </div>
    `
  }

  private renderPreparationScreen(): void {
    this.container.innerHTML = ""

    // Header with match info
    const header = document.createElement("div")
    header.className = "text-center mb-8"
    header.innerHTML = `
      <div class="text-6xl mb-4 animate-pulse">🎮</div>
      <h1 class="text-4xl font-bold mb-2 text-white">${i18n.t("game.preparation.getReady")}</h1>
      <p class="text-xl text-gray-300">${this.player1Name} vs ${this.player2Name}</p>
    `
    this.container.appendChild(header)

    // Controls display - large and prominent
    const controlsSection = document.createElement("div")
    controlsSection.className = "max-w-2xl mx-auto mb-8"

    const leftKey = this.isPlayer1 ? "A" : "←"
    const rightKey = this.isPlayer1 ? "D" : "→"

    controlsSection.innerHTML = `
      <div class="bg-gradient-to-br from-42-dark to-gray-900 p-12 rounded-2xl border-2 border-42-accent shadow-2xl">
        <h2 class="text-3xl font-bold mb-8 text-center text-42-accent">${i18n.t("game.yourControls")}</h2>
        <div class="space-y-6">
          <div class="flex items-center justify-between bg-gray-800 p-6 rounded-xl">
            <div class="flex items-center gap-4">
              <div class="text-4xl">⬅️</div>
              <span class="text-2xl text-white font-semibold">${i18n.t("game.moveLeft")}</span>
            </div>
            <kbd class="px-8 py-4 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-lg text-3xl font-bold shadow-lg">${leftKey}</kbd>
          </div>
          <div class="flex items-center justify-between bg-gray-800 p-6 rounded-xl">
            <div class="flex items-center gap-4">
              <div class="text-4xl">➡️</div>
              <span class="text-2xl text-white font-semibold">${i18n.t("game.moveRight")}</span>
            </div>
            <kbd class="px-8 py-4 bg-gradient-to-br from-red-500 to-red-700 text-white rounded-lg text-3xl font-bold shadow-lg">${rightKey}</kbd>
          </div>
        </div>
        <div class="mt-8 text-center">
          <p class="text-gray-400 text-lg">${i18n.t("game.firstTo11")}</p>
        </div>
      </div>
    `
    this.container.appendChild(controlsSection)

    // Countdown display (initially hidden, will show when countdown starts)
    const countdownSection = document.createElement("div")
    countdownSection.id = "countdown-display"
    countdownSection.className = "text-center py-8"
    countdownSection.innerHTML = `
      <div class="text-gray-400 text-lg">
        <div class="animate-pulse">${i18n.t("game.preparation.waitingForOpponent")}</div>
      </div>
    `
    this.container.appendChild(countdownSection)
  }

  private updateCountdownDisplay(): void {
    const countdownEl = document.getElementById("countdown-display")
    if (!countdownEl) {
      return
    }

    if (this.countdownValue > 0) {
      // Show countdown number with animation
      countdownEl.innerHTML = `
        <div class="countdown-number">
          <div class="text-9xl font-bold text-42-accent animate-ping-once mb-4">${this.countdownValue}</div>
          <p class="text-2xl text-white">${i18n.t("game.preparation.getReadyCountdown")}</p>
        </div>
      `
    } else {
      // Show GO!
      countdownEl.innerHTML = `
        <div class="countdown-number">
          <div class="text-9xl font-bold text-green-400 animate-pulse mb-4">${i18n.t("game.preparation.go")}</div>
        </div>
      `
    }
  }

  private renderGameScreen(): void {
    this.container.innerHTML = ""

    // Header
    const header = document.createElement("div")
    header.className = "text-center mb-4 sm:mb-6"
    header.innerHTML = `
      <h1 class="text-2xl sm:text-4xl font-bold mb-2 text-42-accent">3D Pong - Online Match</h1>
      <p class="text-sm sm:text-base text-gray-400">${i18n.t("game.subtitle") || "First to 11 wins!"}</p>
    `
    this.container.appendChild(header)

    // Score display
    const scoreDisplay = document.createElement("div")
    scoreDisplay.className = "grid grid-cols-3 gap-2 sm:gap-8 mb-4 sm:mb-8"
    scoreDisplay.innerHTML = `
      <div class="text-center p-3 sm:p-6 bg-42-dark rounded-lg border border-blue-500">
        <div class="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2 truncate">${this.player1Name} ${this.isPlayer1 ? "(You)" : ""}</div>
        <div id="player1-score" class="text-3xl sm:text-6xl font-bold text-42-accent">0</div>
      </div>
      <div class="flex items-center justify-center">
        <div class="text-2xl sm:text-4xl font-bold text-gray-500">VS</div>
      </div>
      <div class="text-center p-3 sm:p-6 bg-42-dark rounded-lg border border-red-500">
        <div class="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2 truncate">${this.player2Name} ${!this.isPlayer1 ? "(You)" : ""}</div>
        <div id="player2-score" class="text-3xl sm:text-6xl font-bold text-red-400">0</div>
      </div>
    `
    this.container.appendChild(scoreDisplay)

    // Canvas container with camera hint
    const canvasContainer = document.createElement("div")
    canvasContainer.className =
      "bg-black rounded-lg overflow-hidden shadow-2xl mb-6 relative"
    canvasContainer.appendChild(this.canvas)

    // Add camera control hint
    const hint = document.createElement("div")
    hint.id = "camera-hint-online"
    hint.className =
      "absolute top-4 right-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm animate-pulse pointer-events-none"
    const hintText = this.isMobile
      ? i18n.t("game.cameraHintMobile")
      : i18n.t("game.cameraHint")
    const hintIcon = this.isMobile ? "👆" : "🖱️"
    hint.innerHTML = `
      <div class="flex items-center gap-2">
        <span>${hintIcon}</span>
        <span>${hintText}</span>
      </div>
    `
    canvasContainer.appendChild(hint)

    // Remove hint after user interacts
    let hintRemoved = false
    const removeHint = () => {
      if (!hintRemoved) {
        hint.remove()
        hintRemoved = true
      }
    }
    this.canvas.addEventListener("mousedown", removeHint, { once: true })
    this.canvas.addEventListener("wheel", removeHint, { once: true })
    this.canvas.addEventListener("touchstart", removeHint, { once: true })

    this.container.appendChild(canvasContainer)

    // Controls info (hide on mobile)
    if (!this.isMobile) {
      const controlsInfo = document.createElement("div")
      controlsInfo.className =
        "bg-42-dark p-6 rounded-lg border border-gray-700"
      const leftKey = this.isPlayer1 ? "A" : "←"
      const rightKey = this.isPlayer1 ? "D" : "→"
      controlsInfo.innerHTML = `
        <h3 class="text-xl font-bold mb-4 text-white">${i18n.t("game.controls") || "Your Controls"}</h3>
        <div class="space-y-2 text-gray-300">
          <div class="flex justify-between">
            <span>${i18n.t("game.moveLeft") || "Move Left"}:</span>
            <kbd class="px-3 py-1 bg-gray-700 rounded">${leftKey}</kbd>
          </div>
          <div class="flex justify-between">
            <span>${i18n.t("game.moveRight") || "Move Right"}:</span>
            <kbd class="px-3 py-1 bg-gray-700 rounded">${rightKey}</kbd>
          </div>
        </div>
      `
      this.container.appendChild(controlsInfo)
    }

    // Mobile controls
    if (this.isMobile) {
      this.mobileControls = this.createMobileControls()
      this.container.appendChild(this.mobileControls)
    }
  }

  private createMobileControls(): HTMLDivElement {
    const controls = document.createElement("div")
    controls.className =
      "fixed bottom-0 left-0 right-0 bg-42-dark border-t border-gray-700 p-4 z-10"

    const controlsContainer = document.createElement("div")
    controlsContainer.className = "max-w-7xl mx-auto grid grid-cols-2 gap-8"

    // Left button
    const leftButton = document.createElement("button")
    leftButton.className =
      "bg-gradient-to-br from-blue-600 to-blue-700 active:from-blue-700 active:to-blue-800 text-white font-bold py-8 px-6 rounded-xl shadow-lg active:shadow-inner text-2xl select-none touch-manipulation flex items-center justify-center gap-3"
    leftButton.innerHTML = `
      <span class="text-4xl">←</span>
      <span>${i18n.t("game.moveLeft")}</span>
    `

    // Right button
    const rightButton = document.createElement("button")
    rightButton.className =
      "bg-gradient-to-br from-red-600 to-red-700 active:from-red-700 active:to-red-800 text-white font-bold py-8 px-6 rounded-xl shadow-lg active:shadow-inner text-2xl select-none touch-manipulation flex items-center justify-center gap-3"
    rightButton.innerHTML = `
      <span>${i18n.t("game.moveRight")}</span>
      <span class="text-4xl">→</span>
    `

    // Button event handlers
    const handleLeftStart = () => {
      if (this.engine) {
        this.engine.setMobileButtonState(true, false)
      }
    }

    const handleRightStart = () => {
      if (this.engine) {
        this.engine.setMobileButtonState(false, true)
      }
    }

    const handleButtonEnd = () => {
      if (this.engine) {
        this.engine.setMobileButtonState(false, false)
      }
    }

    // Touch events for left button
    leftButton.addEventListener("touchstart", (e) => {
      e.preventDefault()
      handleLeftStart()
    })
    leftButton.addEventListener("touchend", (e) => {
      e.preventDefault()
      handleButtonEnd()
    })
    leftButton.addEventListener("touchcancel", (e) => {
      e.preventDefault()
      handleButtonEnd()
    })

    // Touch events for right button
    rightButton.addEventListener("touchstart", (e) => {
      e.preventDefault()
      handleRightStart()
    })
    rightButton.addEventListener("touchend", (e) => {
      e.preventDefault()
      handleButtonEnd()
    })
    rightButton.addEventListener("touchcancel", (e) => {
      e.preventDefault()
      handleButtonEnd()
    })

    // Mouse events for desktop testing
    leftButton.addEventListener("mousedown", handleLeftStart)
    leftButton.addEventListener("mouseup", handleButtonEnd)
    leftButton.addEventListener("mouseleave", handleButtonEnd)

    rightButton.addEventListener("mousedown", handleRightStart)
    rightButton.addEventListener("mouseup", handleButtonEnd)
    rightButton.addEventListener("mouseleave", handleButtonEnd)

    controlsContainer.appendChild(leftButton)
    controlsContainer.appendChild(rightButton)
    controls.appendChild(controlsContainer)

    return controls
  }

  private showGameEndModal(winnerId: 1 | 2): void {
    // Determine if the current player won
    const didIWin =
      (this.isPlayer1 && winnerId === 1) || (!this.isPlayer1 && winnerId === 2)
    const winnerName = winnerId === 1 ? this.player1Name : this.player2Name

    // Get final scores
    const finalState = this.engine?.getState()
    const finalScore = finalState
      ? `${finalState.player1Score} - ${finalState.player2Score}`
      : "N/A"

    // Create modal with similar style to GamePage
    const titleEmoji = didIWin ? "🏆" : "😔"
    const contentEmoji = didIWin ? "🎉" : "💔"
    const titleColor = didIWin ? "text-green-400" : "text-red-400"

    const modal = new Modal({
      title: `${titleEmoji} ${i18n.t("game.gameOver.title") || "Game Over!"}`,
      content: `
        <div class="text-center py-8">
          <div class="text-6xl mb-6">${contentEmoji}</div>
          <h2 class="text-3xl font-bold mb-4 ${titleColor}">
            ${winnerName} ${i18n.t("game.gameOver.wins") || "Wins!"}
          </h2>
          <p class="text-xl text-gray-300">${i18n.t("game.gameOver.finalScore") || "Final Score"}:</p>
          <p class="text-2xl font-bold mt-2">${finalScore}</p>
        </div>
      `,
      footer: [
        new Button({
          text: i18n.t("game.gameOver.playAgain") || "Play Again",
          variant: "primary",
          onClick: () => {
            modal.close()
            this.cleanup()
            globalThis.dispatchEvent(
              new CustomEvent("navigate", { detail: "/online-play" }),
            )
          },
        }).getElement(),
        new Button({
          text: i18n.t("game.gameOver.exit") || "Exit",
          variant: "secondary",
          onClick: () => {
            modal.close()
            this.cleanup()
            globalThis.dispatchEvent(
              new CustomEvent("navigate", { detail: "/" }),
            )
          },
        }).getElement(),
      ],
      closeOnOverlay: false,
    })

    modal.open()
  }

  private showError(message: string): void {
    this.container.innerHTML = `
      <div class="text-center py-20">
        <div class="text-6xl mb-6">❌</div>
        <h2 class="text-3xl font-bold mb-4 text-white">Error</h2>
        <p class="text-gray-300 mb-8">${message}</p>
        <button id="back-home" class="bg-42-accent hover:bg-42-accent-dark text-white px-6 py-3 rounded-lg transition-colors">
          Back to Home
        </button>
      </div>
    `

    const backBtn = this.container.querySelector("#back-home")
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        globalThis.dispatchEvent(new CustomEvent("navigate", { detail: "/" }))
      })
    }
  }

  private cleanup(): void {
    // Stop paddle updates
    if (this.paddleUpdateInterval) {
      clearInterval(this.paddleUpdateInterval)
      this.paddleUpdateInterval = null
    }

    // Clean up socket listeners
    socketService.off("startPreparation")
    socketService.off("countdown")
    socketService.off("gameStart")
    socketService.off("gameState")
    socketService.off("scoreUpdate")
    socketService.off("gameEnd")
    socketService.off("opponentDisconnected")
    socketService.off("connected")
    socketService.off("error")

    // Dispose engine
    if (this.engine) {
      this.engine.dispose()
      this.engine = null
    }
  }

  getElement(): HTMLDivElement {
    return this.container
  }

  destroy(): void {
    this.cleanup()
  }
}
