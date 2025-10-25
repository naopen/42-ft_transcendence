// Socket.IO Event Types

// Client -> Server events
export interface ClientToServerEvents {
  // Matchmaking
  joinQueue: () => void
  leaveQueue: () => void

  // Game events
  paddleMove: (data: { x: number }) => void
  ready: () => void
  disconnect: () => void
}

// Server -> Client events
export interface ServerToClientEvents {
  // Matchmaking
  queueJoined: () => void
  queueLeft: () => void
  matchFound: (data: { gameRoomId: string; opponentName: string }) => void

  // Pre-game preparation
  startPreparation: (data: {
    player1Name: string
    player2Name: string
    isPlayer1: boolean
  }) => void
  countdown: (data: { count: number }) => void

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

// Game state
export interface GameState {
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

// Socket data (attached to each socket)
export interface SocketData {
  userId: number
  userName: string
  gameRoomId?: string
}
