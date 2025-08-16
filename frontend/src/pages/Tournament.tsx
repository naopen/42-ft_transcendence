import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import TournamentBracket from '../components/TournamentBracket';
import CreateTournament from '../components/CreateTournament';
import TournamentMatch from '../components/TournamentMatch';

interface Tournament {
  id: number;
  name: string;
  total_players: number;
  current_round: number;
  status: string;
  winner_alias?: string;
}

interface TournamentPlayer {
  id: number;
  alias: string;
  eliminated_round?: number;
}

interface TournamentGame {
  id: number;
  round: number;
  match_number: number;
  player1_alias: string;
  player2_alias: string;
  player1_score: number;
  player2_score: number;
  winner_alias?: string;
  status: string;
}

function Tournament() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [matches, setMatches] = useState<TournamentGame[]>([]);
  const [currentMatch, setCurrentMatch] = useState<TournamentGame | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadTournament(parseInt(id));
    }
  }, [id]);

  const loadTournament = async (tournamentId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/games/tournament/${tournamentId}`);
      const { tournament: tournamentData, players: playersData, matches: matchesData } = response.data;
      
      setTournament(tournamentData);
      setPlayers(playersData);
      setMatches(matchesData);
      
      // Find the next match to play
      const nextMatch = matchesData.find((m: TournamentGame) => m.status === 'ready');
      if (nextMatch) {
        setCurrentMatch(nextMatch);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load tournament');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTournament = async (name: string, playerAliases: string[]) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/games/tournament', {
        name,
        players: playerAliases,
      });
      
      const { tournamentId } = response.data;
      navigate(`/tournament/${tournamentId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create tournament');
      setLoading(false);
    }
  };

  const handleMatchResult = async (matchId: number, player1Score: number, player2Score: number) => {
    if (!tournament) return;
    
    try {
      await api.post(`/games/tournament/${tournament.id}/match/${matchId}/result`, {
        player1Score,
        player2Score,
      });
      
      // Reload tournament data
      await loadTournament(tournament.id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update match result');
    }
  };

  // Show create tournament form if no ID
  if (!id) {
    return (
      <CreateTournament
        onCreateTournament={handleCreateTournament}
        loading={loading}
        error={error}
      />
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-400">Loading tournament...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !tournament) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Tournament not found'}</p>
          <button onClick={() => navigate('/tournament')} className="btn-primary">
            {t('createTournament')}
          </button>
        </div>
      </div>
    );
  }

  // Show tournament complete state
  if (tournament.status === 'completed' && tournament.winner_alias) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-42-gray rounded-2xl shadow-2xl p-8 text-center animate-fadeIn">
          <h1 className="text-4xl font-bold text-42-primary mb-4 neon-text">
            {t('tournamentWinner')}
          </h1>
          <p className="text-5xl font-bold text-white mb-8">
            🏆 {tournament.winner_alias} 🏆
          </p>
          
          <TournamentBracket
            tournament={tournament}
            matches={matches}
            players={players}
          />
          
          <button
            onClick={() => navigate('/tournament')}
            className="btn-primary mt-8"
          >
            {t('createTournament')}
          </button>
        </div>
      </div>
    );
  }

  // Show current match to play
  if (currentMatch) {
    return (
      <TournamentMatch
        tournament={tournament}
        match={currentMatch}
        onMatchComplete={handleMatchResult}
      />
    );
  }

  // Show tournament bracket
  return (
    <div className="space-y-6">
      {/* Tournament Header */}
      <div className="bg-42-gray rounded-lg p-6">
        <h1 className="text-3xl font-bold text-white mb-2">{tournament.name}</h1>
        <div className="flex items-center space-x-6 text-gray-400">
          <span>{tournament.total_players} Players</span>
          <span>{t('currentRound', { round: tournament.current_round })}</span>
          <span className="text-42-primary">{tournament.status}</span>
        </div>
      </div>

      {/* Tournament Bracket */}
      <TournamentBracket
        tournament={tournament}
        matches={matches}
        players={players}
      />

      {/* Players List */}
      <div className="bg-42-gray rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Players</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {players.map((player) => (
            <div
              key={player.id}
              className={`bg-42-dark rounded-lg p-3 text-center ${
                player.eliminated_round ? 'opacity-50' : ''
              }`}
            >
              <p className="text-white font-medium">{player.alias}</p>
              {player.eliminated_round && (
                <p className="text-xs text-gray-500 mt-1">
                  Eliminated R{player.eliminated_round}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Tournament;
