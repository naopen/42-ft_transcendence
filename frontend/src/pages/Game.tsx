import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import PongGame3D from '../components/PongGame3D';
import GameMatchmaking from '../components/GameMatchmaking';
import GameResults from '../components/GameResults';
import api from '../services/api';
import { connectSocket } from '../services/socket';

function Game() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const gameStore = useGameStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localMode, setLocalMode] = useState(false); // Add local mode for testing
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (id) {
      loadGame(parseInt(id));
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      gameStore.resetGame();
    };
  }, [id]);

  const loadGame = async (gameId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/games/${gameId}`);
      const gameData = response.data;
      
      // Initialize socket connection
      if (user) {
        const socket = connectSocket(user.id);
        socketRef.current = socket;
        gameStore.setSocket(socket);
        
        // Join the game room
        socket.emit('join-game', { gameId });
        
        // Setup socket listeners
        socket.on('game-joined', (data: any) => {
          gameStore.updateGameState({
            gameId: data.gameId,
            player1: data.player1,
            player2: data.player2,
            ball: data.ball,
            status: data.status,
          });
        });

        socket.on('game-ready', (data: any) => {
          gameStore.updateGameState({ status: 'ready' });
        });

        socket.on('game-update', (data: any) => {
          if (data.ball) gameStore.updateBall(data.ball);
          if (data.player1Position !== undefined) {
            gameStore.updatePlayerPosition(gameStore.player1?.id || 0, data.player1Position);
          }
          if (data.player2Position !== undefined) {
            gameStore.updatePlayerPosition(gameStore.player2?.id || 0, data.player2Position);
          }
        });

        socket.on('score-update', (data: any) => {
          gameStore.updateScore(data.player1Score, data.player2Score);
        });

        socket.on('game-ended', (data: any) => {
          gameStore.updateGameState({
            status: 'finished',
            winner: data.winnerId,
          });
        });

        socket.on('player-disconnected', (data: any) => {
          gameStore.updateGameState({ status: 'paused' });
          setError(t('connectionLost'));
        });

        socket.on('error', (error: any) => {
          setError(error.message);
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load game');
    } finally {
      setLoading(false);
    }
  };

  const handleMatchmaking = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/games/match');
      const { gameId, status } = response.data;
      
      if (gameId) {
        navigate(`/game/${gameId}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Matchmaking failed');
      setLoading(false);
    }
  };

  const handleRematch = () => {
    gameStore.resetGame();
    handleMatchmaking();
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  // Show matchmaking if no game ID
  if (!id) {
    return (
      <div className="space-y-6">
        <GameMatchmaking 
          onStartMatchmaking={handleMatchmaking}
          loading={loading}
          error={error}
        />
        {/* Local test mode button */}
        <div className="text-center">
          <button
            onClick={() => {
              setLocalMode(true);
              navigate('/game/local');
            }}
            className="btn-secondary"
          >
            {t('playLocal') || 'Play Local (Test Mode)'}
          </button>
        </div>
      </div>
    );
  }

  // Show game results if game is finished
  if (gameStore.status === 'finished') {
    return (
      <GameResults
        player1={gameStore.player1}
        player2={gameStore.player2}
        winner={gameStore.winner}
        onRematch={handleRematch}
        onBackToHome={handleBackToHome}
      />
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-400">Loading game...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            {t('backToHome')}
          </button>
        </div>
      </div>
    );
  }

  // Show waiting state
  if (gameStore.status === 'waiting') {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-400 text-xl">{t('waitingForOpponent')}</p>
        </div>
      </div>
    );
  }

  // Show countdown if ready
  if (gameStore.status === 'ready') {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-42-primary text-4xl font-bold mb-4">{t('gameStarting')}</p>
          <div className="text-6xl font-bold text-white animate-pulse">3</div>
        </div>
      </div>
    );
  }

  // Show the game
  const isLocalMode = id === 'local';
  
  return (
    <div className="space-y-6">
      {/* Game Header */}
      <div className="bg-42-gray rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <p className="text-sm text-gray-400">{isLocalMode ? 'Player 1' : gameStore.player1?.username}</p>
            <p className="text-2xl font-bold text-white">{gameStore.player1?.score || 0}</p>
          </div>
          <span className="text-gray-500 text-xl">VS</span>
          <div className="text-center">
            <p className="text-sm text-gray-400">{isLocalMode ? 'Player 2 (AI)' : gameStore.player2?.username}</p>
            <p className="text-2xl font-bold text-white">{gameStore.player2?.score || 0}</p>
          </div>
        </div>
        
        {gameStore.status === 'paused' && (
          <div className="text-yellow-500 animate-pulse">
            <span>{t('reconnecting')}</span>
          </div>
        )}
        
        {isLocalMode && (
          <div className="text-42-primary">
            <span>Local Mode</span>
          </div>
        )}
      </div>

      {/* Game Canvas */}
      <div className="bg-42-gray rounded-lg p-4" style={{ height: '600px' }}>
        <PongGame3D />
      </div>

      {/* Controls Info */}
      <div className="bg-42-gray rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">{t('controls')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Single Player Mode */}
          <div className="border border-gray-700 rounded p-3">
            <h4 className="text-sm font-semibold text-42-primary mb-2">Single Player / Player 1 (Left)</h4>
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <kbd className="px-3 py-1 bg-42-dark rounded text-42-primary font-mono">W</kbd>
                <p className="text-xs text-gray-400 mt-1">{t('moveUp')}</p>
              </div>
              <div className="text-center">
                <kbd className="px-3 py-1 bg-42-dark rounded text-42-primary font-mono">S</kbd>
                <p className="text-xs text-gray-400 mt-1">{t('moveDown')}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">Or use Arrow Keys in single player</p>
          </div>
          
          {/* Two Player Mode */}
          <div className="border border-gray-700 rounded p-3">
            <h4 className="text-sm font-semibold text-42-secondary mb-2">Player 2 (Right) - Two Player Mode</h4>
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <kbd className="px-3 py-1 bg-42-dark rounded text-42-secondary font-mono">↑</kbd>
                <p className="text-xs text-gray-400 mt-1">{t('moveUp')}</p>
              </div>
              <div className="text-center">
                <kbd className="px-3 py-1 bg-42-dark rounded text-42-secondary font-mono">↓</kbd>
                <p className="text-xs text-gray-400 mt-1">{t('moveDown')}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">AI controlled in single player</p>
          </div>
        </div>
        
        {/* Additional Controls */}
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="flex justify-center gap-6 text-xs">
            <div className="text-center">
              <kbd className="px-2 py-1 bg-gray-700 rounded text-gray-300 font-mono">P</kbd> / <kbd className="px-2 py-1 bg-gray-700 rounded text-gray-300 font-mono">ESC</kbd>
              <p className="text-gray-400 mt-1">Pause</p>
            </div>
            <div className="text-center">
              <kbd className="px-2 py-1 bg-gray-700 rounded text-gray-300 font-mono">R</kbd>
              <p className="text-gray-400 mt-1">Restart (after game ends)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Game;
