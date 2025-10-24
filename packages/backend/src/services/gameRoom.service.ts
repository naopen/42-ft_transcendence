import { v4 as uuidv4 } from "uuid"

import { gameService } from "./game.service"

import type {
  ClientToServerEvents,
  GameState,
  ServerToClientEvents,
  SocketData,
} from "../types/socket.types"
import type { Server, Socket } from "socket.io"

type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>

interface Player {
  socket: TypedSocket
  userId: number
  userName: string
  paddleX: number
  score: number
  isReady: boolean
}

interface GameRoom {
  id: string
  player1: Player
  player2: Player
  ball: {
    x: number
    y: number
    z: number
    velocityX: number
    velocityZ: number
  }
  gameStarted: boolean
  gameEnded: boolean
  gameSessionId: number | null
  startTime: number | null
  lastUpdate: number
  gameLoopInterval: NodeJS.Timeout | null
}

export class GameRoomManager {
  private rooms = new Map<string, GameRoom>()
  private playerToRoom = new Map<number, string>()

  constructor(
    private io: Server<
      ClientToServerEvents,
      ServerToClientEvents,
      Record<string, never>,
      SocketData
    >,
  ) {}

  /**
   * Create a new game room
   */
  createRoom(
    player1: { socket: TypedSocket; userId: number; userName: string },
    player2: { socket: TypedSocket; userId: number; userName: string },
  ): string {
    const roomId = uuidv4()

    const room: GameRoom = {
      id: roomId,
      player1: {
        socket: player1.socket,
        userId: player1.userId,
        userName: player1.userName,
        paddleX: 0,
        score: 0,
        isReady: false,
      },
      player2: {
        socket: player2.socket,
        userId: player2.userId,
        userName: player2.userName,
        paddleX: 0,
        score: 0,
        isReady: false,
      },
      ball: {
        x: 0,
        y: 0.4,
        z: 0,
        velocityX: 0,
        velocityZ: 0,
      },
      gameStarted: false,
      gameEnded: false,
      gameSessionId: null,
      startTime: null,
      lastUpdate: Date.now(),
      gameLoopInterval: null,
    }

    this.rooms.set(roomId, room)
    this.playerToRoom.set(player1.userId, roomId)
    this.playerToRoom.set(player2.userId, roomId)

    // Store room ID in socket data
    player1.socket.data.gameRoomId = roomId
    player2.socket.data.gameRoomId = roomId

    // Join socket.io room
    player1.socket.join(roomId)
    player2.socket.join(roomId)

    return roomId
  }

  /**
   * Get room by ID
   */
  getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId)
  }

  /**
   * Get room by player user ID
   */
  getRoomByPlayer(userId: number): GameRoom | undefined {
    const roomId = this.playerToRoom.get(userId)
    if (!roomId) {
      return undefined
    }
    return this.rooms.get(roomId)
  }

  /**
   * Mark player as ready
   */
  setPlayerReady(userId: number): void {
    const room = this.getRoomByPlayer(userId)
    if (!room) {
      return
    }

    if (room.player1.userId === userId) {
      room.player1.isReady = true
    } else if (room.player2.userId === userId) {
      room.player2.isReady = true
    }

    // If both players ready, start game
    if (room.player1.isReady && room.player2.isReady && !room.gameStarted) {
      this.startGame(room)
    }
  }

  /**
   * Start game
   */
  private startGame(room: GameRoom): void {
    room.gameStarted = true
    room.startTime = Date.now()

    // Create game session in database
    try {
      const session = gameService.createGameSession(
        "online",
        room.player1.userId,
        room.player2.userId,
      )
      room.gameSessionId = session.id
    } catch (error) {
      // CRITICAL: Log errors (database failures)
      console.error("[GameRoom] Failed to create game session:", error)
    }

    // Reset ball
    room.ball = {
      x: 0,
      y: 0.4,
      z: 0,
      velocityX: (Math.random() - 0.5) * 0.2,
      velocityZ: (Math.random() > 0.5 ? 1 : -1) * 0.3,
    }

    // Notify players
    room.player1.socket.emit("gameStart", {
      player1Name: room.player1.userName,
      player2Name: room.player2.userName,
      isPlayer1: true,
    })

    room.player2.socket.emit("gameStart", {
      player1Name: room.player1.userName,
      player2Name: room.player2.userName,
      isPlayer1: false,
    })

    // Start game loop
    this.startGameLoop(room)
  }

  /**
   * Update paddle position
   */
  updatePaddle(userId: number, x: number): void {
    const room = this.getRoomByPlayer(userId)
    if (!room || !room.gameStarted || room.gameEnded) {
      return
    }

    // CRITICAL: Validate input from client to prevent cheating
    if (typeof x !== "number" || !Number.isFinite(x)) {
      console.warn(
        `[GameRoom] 🚨 Invalid paddle position from user ${userId}: ${x}`,
      )
      return
    }

    // CRITICAL: Clamp paddle position to valid range (server-authoritative)
    const FIELD_WIDTH = 20
    const PADDLE_WIDTH = 4
    const maxX = (FIELD_WIDTH - PADDLE_WIDTH) / 2
    const validatedX = Math.max(-maxX, Math.min(maxX, x))

    // Log if client sent out-of-bounds value (potential cheating attempt)
    if (Math.abs(validatedX - x) > 0.01) {
      console.warn(
        `[GameRoom] ⚠️  Clamped paddle position for user ${userId}: ${x.toFixed(2)} → ${validatedX.toFixed(2)}`,
      )
    }

    if (room.player1.userId === userId) {
      room.player1.paddleX = validatedX
      // Notify opponent with validated position
      room.player2.socket.emit("opponentPaddleMove", { x: validatedX })
    } else if (room.player2.userId === userId) {
      room.player2.paddleX = validatedX
      // Notify opponent with validated position
      room.player1.socket.emit("opponentPaddleMove", { x: validatedX })
    }
  }

  /**
   * Game loop - runs on server for authoritative game state
   */
  private startGameLoop(room: GameRoom): void {
    const TICK_RATE = 60 // 60 FPS
    const TICK_INTERVAL = 1000 / TICK_RATE

    const gameLoop = setInterval(() => {
      if (!this.rooms.has(room.id) || room.gameEnded) {
        clearInterval(gameLoop)
        return
      }

      this.updateGameState(room)

      // Broadcast game state to both players
      const state: GameState = {
        ball: {
          x: room.ball.x,
          y: room.ball.y,
          z: room.ball.z,
        },
        player1: {
          x: room.player1.paddleX,
          score: room.player1.score,
        },
        player2: {
          x: room.player2.paddleX,
          score: room.player2.score,
        },
        timestamp: Date.now(),
      }

      this.io.to(room.id).emit("gameState", state)

      room.lastUpdate = Date.now()
    }, TICK_INTERVAL)

    // Store interval ID for cleanup
    room.gameLoopInterval = gameLoop
  }

  /**
   * Update game physics (server-authoritative)
   */
  private updateGameState(room: GameRoom): void {
    // Stop updating if game has ended
    if (room.gameEnded) {
      return
    }

    // Update ball position
    room.ball.x += room.ball.velocityX
    room.ball.z += room.ball.velocityZ

    // Wall collision (left/right)
    const FIELD_WIDTH = 20
    const maxX = FIELD_WIDTH / 2 - 0.5
    if (room.ball.x <= -maxX || room.ball.x >= maxX) {
      room.ball.velocityX *= -1
      room.ball.x = room.ball.x <= -maxX ? -maxX : maxX
    }

    // Paddle collision detection
    const FIELD_LENGTH = 30
    const PADDLE_HEIGHT = 4

    // Player 1 paddle (bottom)
    const paddle1Z = -FIELD_LENGTH / 2 + 2
    if (
      Math.abs(room.ball.z - paddle1Z) < 1 &&
      Math.abs(room.ball.x - room.player1.paddleX) < PADDLE_HEIGHT / 2
    ) {
      room.ball.velocityZ *= -1.05
      room.ball.z = paddle1Z + 1

      // Add spin based on paddle hit position
      const hitOffset =
        (room.ball.x - room.player1.paddleX) / (PADDLE_HEIGHT / 2)
      room.ball.velocityX = hitOffset * 0.15
    }

    // Player 2 paddle (top)
    const paddle2Z = FIELD_LENGTH / 2 - 2
    if (
      Math.abs(room.ball.z - paddle2Z) < 1 &&
      Math.abs(room.ball.x - room.player2.paddleX) < PADDLE_HEIGHT / 2
    ) {
      room.ball.velocityZ *= -1.05
      room.ball.z = paddle2Z - 1

      const hitOffset =
        (room.ball.x - room.player2.paddleX) / (PADDLE_HEIGHT / 2)
      room.ball.velocityX = hitOffset * 0.15
    }

    // Score detection
    if (room.ball.z < -FIELD_LENGTH / 2) {
      // Player 2 scores
      room.player2.score++
      this.handleScore(room)
    } else if (room.ball.z > FIELD_LENGTH / 2) {
      // Player 1 scores
      room.player1.score++
      this.handleScore(room)
    }
  }

  /**
   * Handle score update
   */
  private handleScore(room: GameRoom): void {
    // Don't process score if game has ended
    if (room.gameEnded) {
      return
    }

    // Broadcast score update
    this.io.to(room.id).emit("scoreUpdate", {
      player1Score: room.player1.score,
      player2Score: room.player2.score,
    })

    // Check for winner (first to 11)
    const MAX_SCORE = 11
    if (room.player1.score >= MAX_SCORE || room.player2.score >= MAX_SCORE) {
      this.endGame(room)
    } else {
      // Reset ball
      room.ball = {
        x: 0,
        y: 0.4,
        z: 0,
        velocityX: (Math.random() - 0.5) * 0.2,
        velocityZ: (Math.random() > 0.5 ? 1 : -1) * 0.3,
      }
    }
  }

  /**
   * End game
   */
  private endGame(room: GameRoom): void {
    // CRITICAL: Prevent multiple calls to endGame (race condition protection)
    if (room.gameEnded) {
      console.warn(
        `[GameRoom] ⚠️  endGame called multiple times for room ${room.id} - prevented`,
      )
      return
    }

    // CRITICAL: Atomically set flag and stop game loop to prevent score updates
    room.gameEnded = true

    // CRITICAL: Stop game loop IMMEDIATELY before any other operations
    if (room.gameLoopInterval) {
      clearInterval(room.gameLoopInterval)
      room.gameLoopInterval = null
    }

    // Now scores are frozen - safe to calculate winner
    const winnerId =
      room.player1.score > room.player2.score
        ? room.player1.userId
        : room.player2.userId

    // Save game result to database
    if (room.gameSessionId && room.startTime) {
      try {
        const duration = Math.floor((Date.now() - room.startTime) / 1000) // in seconds
        gameService.completeGameSession(
          room.gameSessionId,
          room.player1.score,
          room.player2.score,
          duration,
        )
      } catch (error) {
        // CRITICAL: Log errors (database failures)
        console.error("[GameRoom] Failed to save game session:", error)
      }
    }

    this.io.to(room.id).emit("gameEnd", {
      winnerId,
      finalScore: {
        player1: room.player1.score,
        player2: room.player2.score,
      },
    })

    // Clean up room after delay
    setTimeout(() => {
      this.destroyRoom(room.id)
    }, 5000)
  }

  /**
   * Destroy room
   */
  destroyRoom(roomId: string): void {
    const room = this.rooms.get(roomId)
    if (!room) {
      return
    }

    // Stop game loop if still running
    if (room.gameLoopInterval) {
      clearInterval(room.gameLoopInterval)
      room.gameLoopInterval = null
    }

    // Remove player mappings
    this.playerToRoom.delete(room.player1.userId)
    this.playerToRoom.delete(room.player2.userId)

    // Remove room
    this.rooms.delete(roomId)
  }

  /**
   * Handle player disconnect
   */
  handleDisconnect(userId: number): void {
    const room = this.getRoomByPlayer(userId)
    if (!room) {
      return
    }

    // Notify opponent
    const opponentSocket =
      room.player1.userId === userId ? room.player2.socket : room.player1.socket

    opponentSocket.emit("opponentDisconnected")

    // Destroy room
    this.destroyRoom(room.id)
  }
}
