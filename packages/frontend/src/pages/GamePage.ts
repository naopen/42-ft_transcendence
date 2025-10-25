import { Alert } from "../components/Alert"
import { Button } from "../components/Button"
import { Modal } from "../components/Modal"
import { GameState, PongEngine } from "../game/PongEngine"
import { i18n } from "../i18n"

export interface GamePageConfig {
  player1Name: string
  player2Name: string
  maxScore?: number
  onGameEnd?: (
    winner: 1 | 2,
    player1Score: number,
    player2Score: number,
  ) => void
}

export class GamePage {
  private container: HTMLDivElement
  private canvas: HTMLCanvasElement
  private engine: PongEngine | null = null
  private config: GamePageConfig
  private countdownValue = 3
  private isCountingDown = false

  // UI elements
  private scoreDisplay: HTMLDivElement
  private controlsInfo: HTMLDivElement
  private startButton: Button
  private pauseButton: Button
  private quitButton: Button

  constructor(config: GamePageConfig) {
    this.config = config
    this.container = document.createElement("div")
    this.container.className = "max-w-7xl mx-auto"

    // Create canvas
    this.canvas = document.createElement("canvas")
    this.canvas.id = "game-canvas"
    this.canvas.className = "w-full rounded-lg shadow-2xl"
    this.canvas.width = 1280
    this.canvas.height = 720

    // Create UI elements
    this.scoreDisplay = this.createScoreDisplay()

    this.startButton = new Button({
      text: i18n.t("game.startGame") || "Start Game",
      variant: "primary",
      size: "lg",
      onClick: () => this.startGame(),
    })

    this.pauseButton = new Button({
      text: i18n.t("game.pause") || "Pause",
      variant: "secondary",
      onClick: () => this.togglePause(),
    })

    this.quitButton = new Button({
      text: i18n.t("game.quit") || "Quit",
      variant: "danger",
      onClick: () => this.confirmQuit(),
    })

    this.controlsInfo = this.createControlsInfo()

    this.render()

    // Initialize engine in preview mode (scene rendered but game not started)
    this.initializePreview()
  }

  private createScoreDisplay(): HTMLDivElement {
    const display = document.createElement("div")
    display.className = "grid grid-cols-3 gap-8 mb-8"
    display.innerHTML = `
      <div class="text-center p-6 bg-42-dark rounded-lg border border-blue-500">
        <div class="text-sm text-gray-400 mb-2">${this.config.player1Name}</div>
        <div id="player1-score" class="text-6xl font-bold text-42-accent">0</div>
      </div>
      <div class="flex items-center justify-center">
        <div class="text-4xl font-bold text-gray-500">VS</div>
      </div>
      <div class="text-center p-6 bg-42-dark rounded-lg border border-red-500">
        <div class="text-sm text-gray-400 mb-2">${this.config.player2Name}</div>
        <div id="player2-score" class="text-6xl font-bold text-red-400">0</div>
      </div>
    `
    return display
  }

  private createControlsInfo(): HTMLDivElement {
    const info = document.createElement("div")
    info.className = "grid md:grid-cols-2 gap-6 mt-8"

    info.innerHTML = `
      <div class="bg-42-dark p-6 rounded-lg border border-blue-500">
        <h3 class="text-xl font-bold mb-4 text-42-accent">${this.config.player1Name} ${i18n.t("game.controls") || "Controls"}</h3>
        <div class="space-y-2 text-gray-300">
          <div class="flex justify-between">
            <span>${i18n.t("game.moveLeft") || "Move Left"}:</span>
            <kbd class="px-3 py-1 bg-gray-700 rounded">A</kbd>
          </div>
          <div class="flex justify-between">
            <span>${i18n.t("game.moveRight") || "Move Right"}:</span>
            <kbd class="px-3 py-1 bg-gray-700 rounded">D</kbd>
          </div>
        </div>
      </div>
      <div class="bg-42-dark p-6 rounded-lg border border-red-500">
        <h3 class="text-xl font-bold mb-4 text-red-400">${this.config.player2Name} ${i18n.t("game.controls") || "Controls"}</h3>
        <div class="space-y-2 text-gray-300">
          <div class="flex justify-between">
            <span>${i18n.t("game.moveLeft") || "Move Left"}:</span>
            <kbd class="px-3 py-1 bg-gray-700 rounded">←</kbd>
          </div>
          <div class="flex justify-between">
            <span>${i18n.t("game.moveRight") || "Move Right"}:</span>
            <kbd class="px-3 py-1 bg-gray-700 rounded">→</kbd>
          </div>
        </div>
      </div>
    `

    return info
  }

  private render(): void {
    this.container.innerHTML = ""

    // Header
    const header = document.createElement("div")
    header.className = "text-center mb-6"
    header.innerHTML = `
      <h1 class="text-4xl font-bold mb-2 text-42-accent">3D Pong</h1>
      <p class="text-gray-400">${i18n.t("game.subtitle") || "First to score wins!"} ${this.config.maxScore || 11}</p>
    `
    this.container.appendChild(header)

    // Score display
    this.container.appendChild(this.scoreDisplay)

    // Game canvas container with hint overlay
    const canvasContainer = document.createElement("div")
    canvasContainer.className =
      "bg-black rounded-lg overflow-hidden shadow-2xl mb-6 relative"
    canvasContainer.appendChild(this.canvas)

    // Add camera control hint overlay (removed after first interaction)
    const hint = document.createElement("div")
    hint.id = "camera-hint"
    hint.className =
      "absolute top-4 right-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm animate-pulse pointer-events-none"
    hint.innerHTML = `
      <div class="flex items-center gap-2">
        <span>🖱️</span>
        <span>Drag to rotate • Scroll to zoom</span>
      </div>
    `
    canvasContainer.appendChild(hint)

    // Remove hint after user interacts with canvas
    let hintRemoved = false
    const removeHint = () => {
      if (!hintRemoved) {
        hint.remove()
        hintRemoved = true
      }
    }
    this.canvas.addEventListener("mousedown", removeHint, { once: true })
    this.canvas.addEventListener("wheel", removeHint, { once: true })

    this.container.appendChild(canvasContainer)

    // Controls
    const controls = document.createElement("div")
    controls.className = "flex items-center justify-center gap-4 mb-6"
    controls.appendChild(this.startButton.getElement())
    controls.appendChild(this.pauseButton.getElement())
    controls.appendChild(this.quitButton.getElement())
    this.container.appendChild(controls)

    // Controls info
    this.container.appendChild(this.controlsInfo)

    // Initialize pause button as disabled
    this.pauseButton.setDisabled(true)
  }

  private initializePreview(): void {
    // Create engine but don't start the game yet
    this.engine = new PongEngine({
      canvas: this.canvas,
      player1Name: this.config.player1Name,
      player2Name: this.config.player2Name,
      maxScore: this.config.maxScore,
      onScoreUpdate: (p1Score, p2Score) => this.updateScore(p1Score, p2Score),
      onGameEnd: (winner) => this.handleGameEnd(winner),
    })

    // Scene is rendered but game hasn't started (isPlaying = false)
    // Camera is interactive and user can rotate/zoom
  }

  private startGame(): void {
    if (this.isCountingDown) {
      return
    }

    this.isCountingDown = true
    this.startButton.setDisabled(true)

    // Show countdown overlay
    this.showCountdown()
  }

  private showCountdown(): void {
    // Create countdown overlay
    const overlay = document.createElement("div")
    overlay.id = "countdown-overlay"
    overlay.className =
      "fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
    overlay.innerHTML = `
      <div id="countdown-number" class="text-9xl font-bold text-42-accent animate-ping-once">
        ${this.countdownValue}
      </div>
    `
    document.body.appendChild(overlay)

    // Start countdown
    this.countdownValue = 3
    const countdownInterval = setInterval(() => {
      this.countdownValue--

      const countdownEl = document.getElementById("countdown-number")
      if (!countdownEl) {
        clearInterval(countdownInterval)
        return
      }

      if (this.countdownValue > 0) {
        // Show number
        countdownEl.textContent = this.countdownValue.toString()
        countdownEl.className =
          "text-9xl font-bold text-42-accent animate-ping-once"
      } else if (this.countdownValue === 0) {
        // Show GO!
        countdownEl.textContent = "GO!"
        countdownEl.className =
          "text-9xl font-bold text-green-400 animate-ping-once"
      } else {
        // Remove overlay and start game
        clearInterval(countdownInterval)
        overlay.remove()
        this.actuallyStartGame()
      }
    }, 1000)
  }

  private actuallyStartGame(): void {
    if (!this.engine) {
      return
    }

    // Start the actual game
    this.engine.start()

    // Update UI
    this.isCountingDown = false
    this.pauseButton.setDisabled(false)

    // Focus canvas for keyboard input
    this.canvas.focus()
  }

  private togglePause(): void {
    if (!this.engine) {
      return
    }

    const state = this.engine.getState()

    if (state.isPaused) {
      this.engine.resume()
      this.pauseButton.updateText(i18n.t("game.pause") || "Pause")
    } else {
      this.engine.pause()
      this.pauseButton.updateText(i18n.t("game.resume") || "Resume")
    }
  }

  private confirmQuit(): void {
    const modal = new Modal({
      title: i18n.t("game.confirmQuit.title") || "Quit Game?",
      content: `<p class="text-gray-300">${i18n.t("game.confirmQuit.message") || "Are you sure you want to quit? Progress will be lost."}</p>`,
      footer: [
        new Button({
          text: i18n.t("game.confirmQuit.cancel") || "Cancel",
          variant: "secondary",
          onClick: () => modal.close(),
        }).getElement(),
        new Button({
          text: i18n.t("game.confirmQuit.confirm") || "Quit",
          variant: "danger",
          onClick: () => {
            modal.close()
            this.quit()
          },
        }).getElement(),
      ],
    })

    modal.open()
  }

  private quit(): void {
    if (this.engine) {
      this.engine.dispose()
      this.engine = null
    }

    // Navigate back
    window.dispatchEvent(new CustomEvent("navigate", { detail: "/" }))
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

  private handleGameEnd(winner: 1 | 2): void {
    const state = this.engine?.getState()
    if (!state) {
      return
    }

    const winnerName =
      winner === 1 ? this.config.player1Name : this.config.player2Name

    // For tournament mode, we need to wait for user confirmation before calling the callback
    const isTournamentMode = !!this.config.onGameEnd

    // Show winner modal
    const modal = new Modal({
      title: `🏆 ${i18n.t("game.gameOver.title") || "Game Over!"}`,
      content: `
        <div class="text-center py-8">
          <div class="text-6xl mb-6">🎉</div>
          <h2 class="text-3xl font-bold mb-4 text-42-accent">${winnerName} ${i18n.t("game.gameOver.wins") || "Wins!"}</h2>
          <p class="text-xl text-gray-300">${i18n.t("game.gameOver.finalScore") || "Final Score"}:</p>
          <p class="text-2xl font-bold mt-2">${state.player1Score} - ${state.player2Score}</p>
        </div>
      `,
      footer: isTournamentMode
        ? [
            new Button({
              text: i18n.t("game.gameOver.exit") || "Exit",
              variant: "primary",
              onClick: () => {
                modal.close()
                // Call onGameEnd callback only after user clicks exit
                if (this.config.onGameEnd) {
                  this.config.onGameEnd(
                    winner,
                    state.player1Score,
                    state.player2Score,
                  )
                }
              },
            }).getElement(),
          ]
        : [
            new Button({
              text: i18n.t("game.gameOver.playAgain") || "Play Again",
              variant: "primary",
              onClick: () => {
                modal.close()
                // Reset scores
                this.updateScore(0, 0)
                // Enable start button
                this.startButton.setDisabled(false)
                this.startButton.updateText(
                  i18n.t("game.startGame") || "Start Game",
                )
                // Disable pause button
                this.pauseButton.setDisabled(true)
              },
            }).getElement(),
            new Button({
              text: i18n.t("game.gameOver.exit") || "Exit",
              variant: "secondary",
              onClick: () => {
                modal.close()
                this.quit()
              },
            }).getElement(),
          ],
      closeOnOverlay: false,
    })

    modal.open()

    // Reset UI for next game (if applicable)
    if (!isTournamentMode) {
      this.startButton.setDisabled(false)
      this.pauseButton.setDisabled(true)
    }
  }

  getElement(): HTMLDivElement {
    return this.container
  }

  destroy(): void {
    if (this.engine) {
      this.engine.dispose()
      this.engine = null
    }
  }
}
