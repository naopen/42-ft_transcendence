import { Socket, io } from "socket.io-client"

interface ServerToClientEvents {
  // Matchmaking
  queueJoined: () => void
  queueLeft: () => void
  matchFound: (data: { gameRoomId: string; opponentName: string }) => void

  // Game events
  gameStart: (data: {
    player1Name: string
    player2Name: string
    isPlayer1: boolean
  }) => void
  gameState: (data: GameState) => void
  opponentPaddleMove: (data: { x: number }) => void
  scoreUpdate: (data: { player1Score: number; player2Score: number }) => void
  gameEnd: (data: {
    winnerId: number
    finalScore: { player1: number; player2: number }
  }) => void

  // Connection
  connected: (data: { userId: number; userName: string }) => void
  opponentDisconnected: () => void

  // Errors
  error: (data: { message: string }) => void
}

interface ClientToServerEvents {
  joinQueue: () => void
  leaveQueue: () => void
  paddleMove: (data: { x: number }) => void
  ready: () => void
}

interface GameState {
  ball: {
    x: number
    y: number
    z: number
  }
  player1: {
    x: number
    score: number
  }
  player2: {
    x: number
    score: number
  }
  timestamp: number
}

export class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null =
    null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  /**
   * Connect to Socket.IO server
   */
  connect(userId: number, userName: string): void {
    if (this.socket?.connected) {
      console.log("[Socket.IO] Already connected")
      return
    }

    // Detect if we're on HTTPS and construct the backend URL accordingly
    let apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000"

    // In production, use HTTPS if the frontend is served over HTTPS
    if (window.location.protocol === "https:") {
      // Replace http:// with https:// for production
      apiUrl = apiUrl.replace(/^http:/, "https:")
    }

    try {
      this.socket = io(apiUrl, {
        auth: {
          userId,
          userName,
        },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionAttempts: this.maxReconnectAttempts,
      })

      this.setupEventHandlers()
      console.log(`[Socket.IO] Connecting to server at ${apiUrl}...`)
    } catch (error) {
      console.error("[Socket.IO] Connection error:", error)
      throw error
    }
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect(): void {
    if (!this.socket) {
      return
    }

    try {
      this.socket.disconnect()
      this.socket = null
      this.reconnectAttempts = 0
      console.log("[Socket.IO] Disconnected from server")
    } catch (error) {
      console.error("[Socket.IO] Disconnect error:", error)
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  /**
   * Join matchmaking queue
   */
  joinQueue(): void {
    if (!this.socket) {
      throw new Error("Socket not connected")
    }

    try {
      this.socket.emit("joinQueue")
      console.log("[Socket.IO] Joined matchmaking queue")
    } catch (error) {
      console.error("[Socket.IO] Error joining queue:", error)
      throw error
    }
  }

  /**
   * Leave matchmaking queue
   */
  leaveQueue(): void {
    if (!this.socket) {
      return
    }

    try {
      this.socket.emit("leaveQueue")
      console.log("[Socket.IO] Left matchmaking queue")
    } catch (error) {
      console.error("[Socket.IO] Error leaving queue:", error)
    }
  }

  /**
   * Send paddle move
   */
  sendPaddleMove(x: number): void {
    if (!this.socket) {
      return
    }

    try {
      this.socket.emit("paddleMove", { x })
    } catch (error) {
      console.error("[Socket.IO] Error sending paddle move:", error)
    }
  }

  /**
   * Send ready signal
   */
  sendReady(): void {
    if (!this.socket) {
      console.error("[Socket.IO] Cannot send ready - socket not connected")
      throw new Error("Socket not connected")
    }

    if (!this.socket.connected) {
      console.error(
        "[Socket.IO] Cannot send ready - socket exists but not connected",
      )
      throw new Error("Socket not connected")
    }

    try {
      this.socket.emit("ready")
      console.log("[Socket.IO] ✅ Sent ready signal")
    } catch (error) {
      console.error("[Socket.IO] Error sending ready:", error)
      throw error
    }
  }

  /**
   * Register event listener
   */
  on<K extends keyof ServerToClientEvents>(
    event: K,
    callback: ServerToClientEvents[K],
  ): void {
    if (!this.socket) {
      throw new Error("Socket not connected")
    }

    try {
      this.socket.on(event, callback as any)
    } catch (error) {
      console.error(
        `[Socket.IO] Error registering listener for ${event}:`,
        error,
      )
      throw error
    }
  }

  /**
   * Remove event listener
   */
  off<K extends keyof ServerToClientEvents>(
    event: K,
    callback?: ServerToClientEvents[K],
  ): void {
    if (!this.socket) {
      return
    }

    try {
      if (callback) {
        this.socket.off(event, callback as any)
      } else {
        this.socket.off(event)
      }
    } catch (error) {
      console.error(`[Socket.IO] Error removing listener for ${event}:`, error)
    }
  }

  /**
   * Setup internal event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) {
      return
    }

    // Connection events
    this.socket.on("connect", () => {
      console.log("[Socket.IO] Connected to server")
      this.reconnectAttempts = 0
    })

    this.socket.on("disconnect", (reason) => {
      console.log("[Socket.IO] Disconnected:", reason)
    })

    this.socket.on("connect_error", (error) => {
      this.reconnectAttempts++
      console.error(
        `[Socket.IO] Connection error (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}):`,
        error,
      )

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("[Socket.IO] Max reconnection attempts reached")
        this.disconnect()
      }
    })

    // Error handling
    this.socket.on("error", (data) => {
      console.error("[Socket.IO] Server error:", data.message)
    })
  }
}

// Export singleton instance
export const socketService = new SocketService()
