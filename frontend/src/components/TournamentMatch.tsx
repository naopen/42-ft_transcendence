import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface TournamentMatchProps {
  tournament: any;
  match: any;
  onMatchComplete: (matchId: number, player1Score: number, player2Score: number) => void;
}

function TournamentMatch({ tournament, match, onMatchComplete }: TournamentMatchProps) {
  const { t } = useTranslation();
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const animationRef = useRef<number>();

  const WINNING_SCORE = 11;

  useEffect(() => {
    // Handle BYE matches automatically
    if (match.player2_alias === 'BYE') {
      setTimeout(() => {
        onMatchComplete(match.id, WINNING_SCORE, 0);
      }, 1000);
    }
  }, [match]);

  const startMatch = () => {
    setCountdown(3);
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setIsPlaying(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleScoreUpdate = (player: 1 | 2) => {
    if (!isPlaying) return;

    if (player === 1) {
      const newScore = player1Score + 1;
      setPlayer1Score(newScore);
      
      if (newScore >= WINNING_SCORE) {
        endMatch(newScore, player2Score);
      }
    } else {
      const newScore = player2Score + 1;
      setPlayer2Score(newScore);
      
      if (newScore >= WINNING_SCORE) {
        endMatch(player1Score, newScore);
      }
    }
  };

  const endMatch = (p1Score: number, p2Score: number) => {
    setIsPlaying(false);
    onMatchComplete(match.id, p1Score, p2Score);
  };

  // Handle keyboard controls for local play
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      
      // Player 1 scores with 'Q'
      if (e.key === 'q' || e.key === 'Q') {
        handleScoreUpdate(1);
      }
      // Player 2 scores with 'P'
      if (e.key === 'p' || e.key === 'P') {
        handleScoreUpdate(2);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [isPlaying, player1Score, player2Score]);

  if (match.player2_alias === 'BYE') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-42-gray rounded-2xl shadow-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Automatic Win</h2>
          <p className="text-gray-400 mb-4">
            {match.player1_alias} advances automatically (BYE)
          </p>
          <div className="spinner mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Match Header */}
      <div className="bg-42-gray rounded-lg p-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          {tournament.name} - Round {match.round}
        </h2>
        <p className="text-gray-400">Match #{match.match_number}</p>
      </div>

      {/* Score Display */}
      <div className="bg-42-gray rounded-lg p-8">
        <div className="flex items-center justify-center space-x-12">
          <div className="text-center">
            <p className="text-xl text-gray-400 mb-2">{match.player1_alias}</p>
            <p className="text-6xl font-bold text-white">{player1Score}</p>
            {isPlaying && (
              <button
                onClick={() => handleScoreUpdate(1)}
                className="mt-4 px-4 py-2 bg-42-primary text-white rounded-lg hover:bg-opacity-80"
              >
                Score (Q)
              </button>
            )}
          </div>
          
          <div className="text-gray-500 text-4xl">VS</div>
          
          <div className="text-center">
            <p className="text-xl text-gray-400 mb-2">{match.player2_alias}</p>
            <p className="text-6xl font-bold text-white">{player2Score}</p>
            {isPlaying && (
              <button
                onClick={() => handleScoreUpdate(2)}
                className="mt-4 px-4 py-2 bg-42-secondary text-white rounded-lg hover:bg-opacity-80"
              >
                Score (P)
              </button>
            )}
          </div>
        </div>

        {/* Countdown */}
        {countdown > 0 && (
          <div className="text-center mt-8">
            <p className="text-42-primary text-2xl mb-2">{t('gameStarting')}</p>
            <p className="text-6xl font-bold text-white animate-pulse">{countdown}</p>
          </div>
        )}

        {/* Start Button */}
        {!isPlaying && countdown === 0 && player1Score === 0 && player2Score === 0 && (
          <div className="text-center mt-8">
            <button onClick={startMatch} className="btn-primary text-xl px-8 py-4">
              Start Match
            </button>
          </div>
        )}

        {/* Playing Indicator */}
        {isPlaying && (
          <div className="text-center mt-8">
            <p className="text-42-primary text-xl animate-pulse">Match in Progress</p>
            <p className="text-gray-400 mt-2">First to {WINNING_SCORE} points wins</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-42-gray rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-3">Local Play Instructions</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-42-dark rounded-lg p-3">
            <p className="text-42-primary font-semibold mb-1">{match.player1_alias}</p>
            <p className="text-gray-400">Press <kbd className="px-2 py-1 bg-42-gray rounded">Q</kbd> to score</p>
          </div>
          <div className="bg-42-dark rounded-lg p-3">
            <p className="text-42-secondary font-semibold mb-1">{match.player2_alias}</p>
            <p className="text-gray-400">Press <kbd className="px-2 py-1 bg-42-gray rounded">P</kbd> to score</p>
          </div>
        </div>
        <p className="text-gray-500 text-xs mt-3">
          Note: This is a local tournament. Players should play the actual Pong game and record scores here.
        </p>
      </div>
    </div>
  );
}

export default TournamentMatch;
