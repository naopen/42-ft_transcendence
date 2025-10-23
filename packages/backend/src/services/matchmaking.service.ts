import { GameRoomManager } from "./gameRoom.service"

import type {
  ClientToServerEvents,
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

interface QueuedPlayer {
  socket: TypedSocket
  userId: number
  userName: string
  queuedAt: number
}

export class MatchmakingService {
  private queue: QueuedPlayer[] = []
  public gameRoomManager: GameRoomManager

  constructor(
    private io: Server<
      ClientToServerEvents,
      ServerToClientEvents,
      Record<string, never>,
      SocketData
    >,
  ) {
    this.gameRoomManager = new GameRoomManager(io)
  }

  /**
   * Add player to matchmaking queue
   */
  addToQueue(socket: TypedSocket): void {
    const userId = socket.data.userId
    const userName = socket.data.userName

    // Check if player is already in queue
    const existingPlayer = this.queue.find((p) => p.userId === userId)
    if (existingPlayer) {
      socket.emit("error", { message: "Already in queue" })
      return
    }

    // Add to queue
    const player: QueuedPlayer = {
      socket,
      userId,
      userName,
      queuedAt: Date.now(),
    }

    this.queue.push(player)
    socket.emit("queueJoined")

    console.log(
      `[Matchmaking] Player ${userName} (${userId}) joined queue. Queue size: ${this.queue.length}`,
    )

    // Try to find match
    this.tryMatch()
  }

  /**
   * Remove player from matchmaking queue
   */
  removeFromQueue(socket: TypedSocket): void {
    const userId = socket.data.userId
    const index = this.queue.findIndex((p) => p.userId === userId)

    if (index !== -1) {
      this.queue.splice(index, 1)
      socket.emit("queueLeft")

      console.log(
        `[Matchmaking] Player ${socket.data.userName} (${userId}) left queue. Queue size: ${this.queue.length}`,
      )
    }
  }

  /**
   * Try to match players in queue
   */
  private tryMatch(): void {
    // Need at least 2 players to match
    if (this.queue.length < 2) {
      return
    }

    // Take first two players in queue (FIFO)
    const player1 = this.queue.shift()
    const player2 = this.queue.shift()

    // Safety check (should never happen due to length check above)
    if (!player1 || !player2) {
      return
    }

    // Create game room
    const gameRoomId = this.gameRoomManager.createRoom(player1, player2)

    // Notify players
    player1.socket.emit("matchFound", {
      gameRoomId,
      opponentName: player2.userName,
    })

    player2.socket.emit("matchFound", {
      gameRoomId,
      opponentName: player1.userName,
    })

    console.log(
      `[Matchmaking] Match found: ${player1.userName} vs ${player2.userName}. Room: ${gameRoomId}`,
    )
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.queue.length
  }

  /**
   * Clean up disconnected players from queue
   */
  cleanupQueue(): void {
    this.queue = this.queue.filter((player) => player.socket.connected)
  }
}
