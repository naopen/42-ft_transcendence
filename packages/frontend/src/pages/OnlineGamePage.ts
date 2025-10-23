import { PongEngine } from "../game/PongEngine"
import { i18n } from "../i18n"
import { socketService } from "../services/socket.service"
import { authStore } from "../stores/auth.store"

export class OnlineGamePage {
  private container: HTMLDivElement
  private canvas: HTMLCanvasElement
  private engine: PongEngine | null = null
  private roomId: string
  private isPlayer1 = false
  private player1Name = ""
  private player2Name = ""
  private paddleUpdateInterval: number | null = null

  constructor(roomId: string) {
    this.roomId = roomId
    this.container = document.createElement("div")
    this.container.className = "max-w-7xl mx-auto"

    // Create canvas
    this.canvas = document.createElement("canvas")
    this.canvas.id = "game-canvas"
    this.canvas.className = "w-full rounded-lg shadow-2xl"
    this.canvas.width = 1280
    this.canvas.height = 720

    // Check authentication
    const authState = authStore.getState()
    if (!authState.isAuthenticated || !authState.user) {
      this.showError("You must be logged in to play online")
      return
    }

    // Setup Socket.IO connection
    this.setupSocketConnection(authState.user.id, authState.user.displayName)
  }

  private setupSocketConnection(userId: number, userName: string): void {
    try {
      // Connect to Socket.IO server if not already connected
      if (!socketService.isConnected()) {
        socketService.connect(userId, userName)

        // Wait for connection, then send ready signal
        socketService.on("connected", () => {
          console.log("[OnlineGamePage] Connected to server")
          // Send ready signal
          socketService.sendReady()
        })
      } else {
        // Already connected, send ready signal immediately
        console.log("[OnlineGamePage] Already connected, sending ready signal")
        socketService.sendReady()
      }

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
          this.engine.handleServerGameEnd(data.winnerId, data.finalScore)
        }
        this.cleanup()
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
      onGameEnd: () => {
        // Game end is handled by server
        this.cleanup()
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

  private renderGameScreen(): void {
    this.container.innerHTML = ""

    // Header
    const header = document.createElement("div")
    header.className = "text-center mb-6"
    header.innerHTML = `
      <h1 class="text-4xl font-bold mb-2 text-42-accent">3D Pong - Online Match</h1>
      <p class="text-gray-400">${i18n.t("game.subtitle") || "First to 11 wins!"}</p>
    `
    this.container.appendChild(header)

    // Score display
    const scoreDisplay = document.createElement("div")
    scoreDisplay.className = "grid grid-cols-3 gap-8 mb-8"
    scoreDisplay.innerHTML = `
      <div class="text-center p-6 bg-42-dark rounded-lg border border-blue-500">
        <div class="text-sm text-gray-400 mb-2">${this.player1Name} ${this.isPlayer1 ? "(You)" : ""}</div>
        <div id="player1-score" class="text-6xl font-bold text-42-accent">0</div>
      </div>
      <div class="flex items-center justify-center">
        <div class="text-4xl font-bold text-gray-500">VS</div>
      </div>
      <div class="text-center p-6 bg-42-dark rounded-lg border border-red-500">
        <div class="text-sm text-gray-400 mb-2">${this.player2Name} ${!this.isPlayer1 ? "(You)" : ""}</div>
        <div id="player2-score" class="text-6xl font-bold text-red-400">0</div>
      </div>
    `
    this.container.appendChild(scoreDisplay)

    // Canvas container
    const canvasContainer = document.createElement("div")
    canvasContainer.className =
      "bg-black rounded-lg overflow-hidden shadow-2xl mb-6"
    canvasContainer.appendChild(this.canvas)
    this.container.appendChild(canvasContainer)

    // Controls info
    const controlsInfo = document.createElement("div")
    controlsInfo.className = "bg-42-dark p-6 rounded-lg border border-gray-700"
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
        window.dispatchEvent(new CustomEvent("navigate", { detail: "/" }))
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
