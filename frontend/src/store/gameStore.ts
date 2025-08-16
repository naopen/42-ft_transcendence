import { create } from 'zustand';
import { Socket } from 'socket.io-client';

interface GamePlayer {
  id: number;
  username: string;
  position: number;
  score: number;
}

interface Ball {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}

export interface GameState {
  gameId: number | null;
  player1: GamePlayer | null;
  player2: GamePlayer | null;
  ball: Ball | null;
  status: 'idle' | 'waiting' | 'ready' | 'playing' | 'paused' | 'finished';
  winner: number | null;
  socket: Socket | null;
}

interface GameActions {
  setGameId: (id: number) => void;
  setSocket: (socket: Socket) => void;
  updateGameState: (state: Partial<GameState>) => void;
  updateBall: (ball: Ball) => void;
  updatePlayerPosition: (playerId: number, position: number) => void;
  updateScore: (player1Score: number, player2Score: number) => void;
  resetGame: () => void;
}

const initialState: GameState = {
  gameId: null,
  player1: null,
  player2: null,
  ball: null,
  status: 'idle',
  winner: null,
  socket: null,
};

export const useGameStore = create<GameState & GameActions>((set) => ({
  ...initialState,

  setGameId: (id) => set({ gameId: id }),
  
  setSocket: (socket) => set({ socket }),
  
  updateGameState: (state) => set((prev) => ({ ...prev, ...state })),
  
  updateBall: (ball) => set({ ball }),
  
  updatePlayerPosition: (playerId, position) => 
    set((state) => {
      if (state.player1?.id === playerId) {
        return {
          player1: { ...state.player1, position },
        };
      } else if (state.player2?.id === playerId) {
        return {
          player2: { ...state.player2, position },
        };
      }
      return state;
    }),
  
  updateScore: (player1Score, player2Score) =>
    set((state) => ({
      player1: state.player1 ? { ...state.player1, score: player1Score } : null,
      player2: state.player2 ? { ...state.player2, score: player2Score } : null,
    })),
  
  resetGame: () => set(initialState),
}));
