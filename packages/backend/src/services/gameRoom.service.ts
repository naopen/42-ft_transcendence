import { v4 as uuidv4 } from "uuid"

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
  lastUpdate: number
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
      lastUpdate: Date.now(),
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

    console.log(`[GameRoom] Created room ${roomId}`)

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

    console.log(`[GameRoom] Game started in room ${room.id}`)

    // Start game loop
    this.startGameLoop(room)
  }

  /**
   * Update paddle position
   */
  updatePaddle(userId: number, x: number): void {
    const room = this.getRoomByPlayer(userId)
    if (!room || !room.gameStarted) {
      return
    }

    if (room.player1.userId === userId) {
      room.player1.paddleX = x
      // Notify opponent
      room.player2.socket.emit("opponentPaddleMove", { x })
    } else if (room.player2.userId === userId) {
      room.player2.paddleX = x
      // Notify opponent
      room.player1.socket.emit("opponentPaddleMove", { x })
    }
  }

  /**
   * Game loop - runs on server for authoritative game state
   */
  private startGameLoop(room: GameRoom): void {
    const TICK_RATE = 60 // 60 FPS
    const TICK_INTERVAL = 1000 / TICK_RATE

    const gameLoop = setInterval(() => {
      if (!this.rooms.has(room.id)) {
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
  }

  /**
   * Update game physics (server-authoritative)
   */
  private updateGameState(room: GameRoom): void {
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
    const winnerId =
      room.player1.score > room.player2.score
        ? room.player1.userId
        : room.player2.userId

    this.io.to(room.id).emit("gameEnd", {
      winnerId,
      finalScore: {
        player1: room.player1.score,
        player2: room.player2.score,
      },
    })

    console.log(`[GameRoom] Game ended in room ${room.id}. Winner: ${winnerId}`)

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

    // Remove player mappings
    this.playerToRoom.delete(room.player1.userId)
    this.playerToRoom.delete(room.player2.userId)

    // Remove room
    this.rooms.delete(roomId)

    console.log(`[GameRoom] Destroyed room ${roomId}`)
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
