import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface LeaderboardEntry {
  id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  games_played: number;
  games_won: number;
  games_lost: number;
  win_rate: number;
  best_win_streak: number;
}

function Leaderboard() {
  const { t } = useTranslation();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    fetchLeaderboard();
  }, [limit]);

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get(`/users/leaderboard?limit=${limit}`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-yellow-600';
      case 2:
        return 'from-gray-300 to-gray-500';
      case 3:
        return 'from-orange-400 to-orange-600';
      default:
        return 'from-42-gray to-42-dark';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-42-primary to-42-secondary rounded-2xl p-8 text-white shadow-2xl">
        <h1 className="text-4xl font-bold mb-2">{t('leaderboard')}</h1>
        <p className="text-lg opacity-90">Top players ranked by performance</p>
      </div>

      {/* Filter Options */}
      <div className="bg-42-gray rounded-lg p-4 flex justify-between items-center">
        <div className="flex space-x-2">
          {[10, 25, 50].map((num) => (
            <button
              key={num}
              onClick={() => setLimit(num)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                limit === num
                  ? 'bg-42-primary text-white'
                  : 'bg-42-dark text-gray-400 hover:bg-opacity-80'
              }`}
            >
              Top {num}
            </button>
          ))}
        </div>
        <button onClick={fetchLeaderboard} className="text-42-primary hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-42-gray rounded-lg shadow-xl overflow-hidden">
        {leaderboard.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-42-dark">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Games
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Won
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Lost
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Win Rate
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Best Streak
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {leaderboard.map((player, index) => (
                  <tr 
                    key={player.id} 
                    className="hover:bg-42-dark transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-2xl font-bold ${index < 3 ? '' : 'text-gray-400'}`}>
                        {getRankIcon(index + 1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        to={`/profile/${player.id}`}
                        className="flex items-center hover:text-42-primary transition-colors"
                      >
                        {player.avatar_url ? (
                          <img
                            src={player.avatar_url}
                            alt={player.display_name}
                            className="w-10 h-10 rounded-full mr-3"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-42-primary to-42-secondary rounded-full flex items-center justify-center mr-3">
                            <span className="text-white font-bold">
                              {player.username[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">{player.display_name || player.username}</p>
                          <p className="text-gray-500 text-sm">@{player.username}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-white">
                      {player.games_played}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-green-400">
                      {player.games_won}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-red-400">
                      {player.games_lost}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                        player.win_rate >= 0.7 
                          ? 'bg-green-500 bg-opacity-20 text-green-400'
                          : player.win_rate >= 0.5
                          ? 'bg-yellow-500 bg-opacity-20 text-yellow-400'
                          : 'bg-red-500 bg-opacity-20 text-red-400'
                      }`}>
                        {(player.win_rate * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-42-primary font-semibold">
                        {player.best_win_streak} 🔥
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">No players have completed games yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
