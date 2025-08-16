import { Server, Socket } from 'socket.io';
import { db } from '../database/init';

interface GameData {
  id: number;
  player1_id: number;
  player2_id: number;
  player1_username: string;
  player2_username: string;
  status: string;
  started_at?: string;
}

interface GameState {
  gameId: number;
  player1: {
    id: number;
    username: string;
    position: number;
    score: number;
  };
  player2: {
    id: number;
    username: string;
    position: number;
    score: number;
  };
  ball: {
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
  };
  status: 'waiting' | 'ready' | 'playing' | 'paused' | 'finished';
  winner?: number;
}

const games = new Map<number, GameState>();
const playerSockets = new Map<number, string>(); // userId -> socketId

// Game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 10;
const BALL_SIZE = 10;
const PADDLE_SPEED = 5;
const BALL_SPEED = 4;
const WINNING_SCORE = 11;

export function setupGameSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('New socket connection:', socket.id);

    // Handle player authentication
    socket.on('authenticate', async (data: { userId: number }) => {
      const { userId } = data;
      playerSockets.set(userId, socket.id);
      socket.data.userId = userId;

      console.log(`Player ${userId} authenticated with socket ${socket.id}`);
    });

    // Handle joining a game
    socket.on('join-game', async (data: { gameId: number }) => {
      const { gameId } = data;
      const userId = socket.data.userId;

      if (!userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      // Get game from database
      const gameData = db.prepare(`
        SELECT g.*,
               p1.username as player1_username,
               p2.username as player2_username
        FROM games g
        LEFT JOIN users p1 ON g.player1_id = p1.id
        LEFT JOIN users p2 ON g.player2_id = p2.id
        WHERE g.id = ?
      `).get(gameId) as GameData | undefined;

      if (!gameData) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      // Check if user is part of this game
      if (gameData.player1_id !== userId && gameData.player2_id !== userId) {
        // User is a spectator
        socket.join(`game-${gameId}-spectators`);
        socket.emit('spectator-joined', { gameId });
      } else {
        // User is a player
        socket.join(`game-${gameId}`);

        // Initialize or get game state
        if (!games.has(gameId)) {
          games.set(gameId, {
            gameId,
            player1: {
              id: gameData.player1_id,
              username: gameData.player1_username,
              position: GAME_HEIGHT / 2,
              score: 0
            },
            player2: {
              id: gameData.player2_id,
              username: gameData.player2_username,
              position: GAME_HEIGHT / 2,
              score: 0
            },
            ball: resetBall(),
            status: 'waiting'
          });
        }

        const gameState = games.get(gameId)!;

        // Check if both players are connected
        const player1Socket = playerSockets.get(gameData.player1_id);
        const player2Socket = playerSockets.get(gameData.player2_id);

        if (player1Socket && player2Socket && gameState.status === 'waiting') {
          gameState.status = 'ready';

          // Update database
          db.prepare(`
            UPDATE games
            SET status = 'ready', started_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(gameId);

          // Notify both players
          io.to(`game-${gameId}`).emit('game-ready', gameState);

          // Start game after 3 seconds countdown
          setTimeout(() => {
            if (gameState.status === 'ready') {
              gameState.status = 'playing';
              startGameLoop(io, gameId);
            }
          }, 3000);
        }

        socket.emit('game-joined', gameState);
      }
    });

    // Handle paddle movement
    socket.on('move-paddle', (data: { gameId: number; direction: 'up' | 'down' }) => {
      const { gameId, direction } = data;
      const userId = socket.data.userId;

      const gameState = games.get(gameId);
      if (!gameState || gameState.status !== 'playing') return;

      const isPlayer1 = gameState.player1.id === userId;
      const player = isPlayer1 ? gameState.player1 : gameState.player2;

      // Update paddle position
      if (direction === 'up') {
        player.position = Math.max(PADDLE_HEIGHT / 2, player.position - PADDLE_SPEED);
      } else {
        player.position = Math.min(GAME_HEIGHT - PADDLE_HEIGHT / 2, player.position + PADDLE_SPEED);
      }

      // Broadcast paddle position
      io.to(`game-${gameId}`).emit('paddle-moved', {
        playerId: userId,
        position: player.position
      });
    });

    // Handle game pause/resume
    socket.on('pause-game', (data: { gameId: number }) => {
      const { gameId } = data;
      const gameState = games.get(gameId);

      if (gameState && gameState.status === 'playing') {
        gameState.status = 'paused';
        io.to(`game-${gameId}`).emit('game-paused');
      }
    });

    socket.on('resume-game', (data: { gameId: number }) => {
      const { gameId } = data;
      const gameState = games.get(gameId);

      if (gameState && gameState.status === 'paused') {
        gameState.status = 'playing';
        io.to(`game-${gameId}`).emit('game-resumed');
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const userId = socket.data.userId;
      if (userId) {
        playerSockets.delete(userId);

        // Check if player was in a game
        games.forEach((gameState, gameId) => {
          if (gameState.player1.id === userId || gameState.player2.id === userId) {
            if (gameState.status === 'playing') {
              gameState.status = 'paused';
              io.to(`game-${gameId}`).emit('player-disconnected', { userId });

              // Give player 30 seconds to reconnect
              setTimeout(() => {
                if (!playerSockets.has(userId) && gameState.status === 'paused') {
                  // Player didn't reconnect, forfeit the game
                  const winnerId = gameState.player1.id === userId
                    ? gameState.player2.id
                    : gameState.player1.id;

                  endGame(io, gameId, winnerId);
                }
              }, 30000);
            }
          }
        });
      }
    });
  });
}

function resetBall() {
  return {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    velocityX: (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED,
    velocityY: (Math.random() - 0.5) * BALL_SPEED
  };
}

function startGameLoop(io: Server, gameId: number) {
  const gameState = games.get(gameId);
  if (!gameState) return;

  const gameInterval = setInterval(() => {
    if (gameState.status !== 'playing') {
      if (gameState.status === 'finished') {
        clearInterval(gameInterval);
      }
      return;
    }

    // Update ball position
    gameState.ball.x += gameState.ball.velocityX;
    gameState.ball.y += gameState.ball.velocityY;

    // Ball collision with top/bottom walls
    if (gameState.ball.y - BALL_SIZE / 2 <= 0 ||
        gameState.ball.y + BALL_SIZE / 2 >= GAME_HEIGHT) {
      gameState.ball.velocityY = -gameState.ball.velocityY;
    }

    // Ball collision with paddles
    // Left paddle (player 1)
    if (gameState.ball.x - BALL_SIZE / 2 <= PADDLE_WIDTH) {
      if (Math.abs(gameState.ball.y - gameState.player1.position) <= PADDLE_HEIGHT / 2) {
        gameState.ball.velocityX = Math.abs(gameState.ball.velocityX);
        gameState.ball.velocityY += (gameState.ball.y - gameState.player1.position) * 0.1;
      } else {
        // Player 2 scores
        gameState.player2.score++;
        io.to(`game-${gameId}`).emit('score-update', {
          player1Score: gameState.player1.score,
          player2Score: gameState.player2.score
        });

        if (gameState.player2.score >= WINNING_SCORE) {
          endGame(io, gameId, gameState.player2.id);
          clearInterval(gameInterval);
          return;
        }

        gameState.ball = resetBall();
      }
    }

    // Right paddle (player 2)
    if (gameState.ball.x + BALL_SIZE / 2 >= GAME_WIDTH - PADDLE_WIDTH) {
      if (Math.abs(gameState.ball.y - gameState.player2.position) <= PADDLE_HEIGHT / 2) {
        gameState.ball.velocityX = -Math.abs(gameState.ball.velocityX);
        gameState.ball.velocityY += (gameState.ball.y - gameState.player2.position) * 0.1;
      } else {
        // Player 1 scores
        gameState.player1.score++;
        io.to(`game-${gameId}`).emit('score-update', {
          player1Score: gameState.player1.score,
          player2Score: gameState.player2.score
        });

        if (gameState.player1.score >= WINNING_SCORE) {
          endGame(io, gameId, gameState.player1.id);
          clearInterval(gameInterval);
          return;
        }

        gameState.ball = resetBall();
      }
    }

    // Emit game state update
    io.to(`game-${gameId}`).emit('game-update', {
      ball: gameState.ball,
      player1Position: gameState.player1.position,
      player2Position: gameState.player2.position
    });

    // Also emit to spectators
    io.to(`game-${gameId}-spectators`).emit('game-update', {
      ball: gameState.ball,
      player1Position: gameState.player1.position,
      player2Position: gameState.player2.position,
      player1Score: gameState.player1.score,
      player2Score: gameState.player2.score
    });

  }, 1000 / 60); // 60 FPS
}

function endGame(io: Server, gameId: number, winnerId: number) {
  const gameState = games.get(gameId);
  if (!gameState) return;

  gameState.status = 'finished';
  gameState.winner = winnerId;

  // Update database
  const endTime = new Date();
  const startTime = db.prepare('SELECT started_at FROM games WHERE id = ?').get(gameId) as { started_at: string } | undefined;
  const duration = startTime ? Math.floor((endTime.getTime() - new Date(startTime.started_at).getTime()) / 1000) : 0;

  db.prepare(`
    UPDATE games
    SET player1_score = ?, player2_score = ?, winner_id = ?,
        status = 'completed', ended_at = CURRENT_TIMESTAMP, duration = ?
    WHERE id = ?
  `).run(
    gameState.player1.score,
    gameState.player2.score,
    winnerId,
    duration,
    gameId
  );

  // Update user statistics
  updateUserStats(gameState.player1.id, gameState.player1.id === winnerId, gameState.player1.score, gameState.player2.score);
  updateUserStats(gameState.player2.id, gameState.player2.id === winnerId, gameState.player2.score, gameState.player1.score);

  // Notify players and spectators
  io.to(`game-${gameId}`).emit('game-ended', {
    winnerId,
    player1Score: gameState.player1.score,
    player2Score: gameState.player2.score,
    duration
  });

  io.to(`game-${gameId}-spectators`).emit('game-ended', {
    winnerId,
    player1Score: gameState.player1.score,
    player2Score: gameState.player2.score,
    duration
  });

  // Clean up
  games.delete(gameId);
}

function updateUserStats(userId: number, won: boolean, scored: number, conceded: number) {
  const currentStats = db.prepare('SELECT * FROM user_stats WHERE user_id = ?').get(userId) as {
    win_streak: number;
    best_win_streak: number;
  } | undefined;

  if (currentStats) {
    const newWinStreak = won ? currentStats.win_streak + 1 : 0;
    const bestWinStreak = Math.max(currentStats.best_win_streak, newWinStreak);    db.prepare(`
      UPDATE user_stats
      SET games_played = games_played + 1,
          games_won = games_won + ?,
          games_lost = games_lost + ?,
          total_points_scored = total_points_scored + ?,
          total_points_conceded = total_points_conceded + ?,
          win_streak = ?,
          best_win_streak = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(
      won ? 1 : 0,
      won ? 0 : 1,
      scored,
      conceded,
      newWinStreak,
      bestWinStreak,
      userId
    );
  }
}
