import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useEffect, useState } from 'react';
import api from '../services/api';

interface RecentGame {
  id: number;
  player1_username: string;
  player2_username: string;
  player1_score: number;
  player2_score: number;
  winner_username: string;
  created_at: string;
}

function Home() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [gamesRes, statsRes] = await Promise.all([
        api.get('/users/me/games?limit=5'),
        api.get('/users/me')
      ]);
      setRecentGames(gamesRes.data);
      setUserStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-42-primary to-42-secondary rounded-2xl p-8 text-white shadow-2xl">
        <h1 className="text-4xl font-bold mb-2 font-futura">
          {t('welcomeBack')}, {user?.displayName || user?.username}!
        </h1>
        <p className="text-lg opacity-90">
          Ready for your next match?
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/game" className="card card-hover group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-42-primary bg-opacity-20 rounded-lg flex items-center justify-center group-hover:bg-opacity-30 transition-all">
              <svg className="w-6 h-6 text-42-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-42-primary text-2xl font-bold">→</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">{t('play')}</h3>
          <p className="text-gray-400">Start a new match or practice</p>
        </Link>

        <Link to="/tournament" className="card card-hover group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-42-secondary bg-opacity-20 rounded-lg flex items-center justify-center group-hover:bg-opacity-30 transition-all">
              <svg className="w-6 h-6 text-42-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <span className="text-42-secondary text-2xl font-bold">→</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">{t('tournament')}</h3>
          <p className="text-gray-400">Create or join a tournament</p>
        </Link>

        <Link to="/leaderboard" className="card card-hover group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-500 bg-opacity-20 rounded-lg flex items-center justify-center group-hover:bg-opacity-30 transition-all">
              <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-yellow-500 text-2xl font-bold">→</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">{t('leaderboard')}</h3>
          <p className="text-gray-400">Check rankings and stats</p>
        </Link>
      </div>

      {/* Stats Overview */}
      {userStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <p className="text-gray-400 text-sm mb-1">{t('gamesPlayed')}</p>
            <p className="text-3xl font-bold text-white">{userStats.games_played || 0}</p>
          </div>
          <div className="card text-center">
            <p className="text-gray-400 text-sm mb-1">{t('gamesWon')}</p>
            <p className="text-3xl font-bold text-42-primary">{userStats.games_won || 0}</p>
          </div>
          <div className="card text-center">
            <p className="text-gray-400 text-sm mb-1">{t('winRate')}</p>
            <p className="text-3xl font-bold text-white">
              {userStats.games_played > 0 
                ? Math.round((userStats.games_won / userStats.games_played) * 100)
                : 0}%
            </p>
          </div>
          <div className="card text-center">
            <p className="text-gray-400 text-sm mb-1">{t('bestWinStreak')}</p>
            <p className="text-3xl font-bold text-42-secondary">{userStats.best_win_streak || 0}</p>
          </div>
        </div>
      )}

      {/* Recent Games */}
      <div className="card">
        <h2 className="text-2xl font-bold text-white mb-4">{t('recentGames')}</h2>
        {recentGames.length > 0 ? (
          <div className="space-y-3">
            {recentGames.map((game) => (
              <div key={game.id} className="bg-42-dark rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-400">
                      {new Date(game.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`font-semibold ${game.winner_username === game.player1_username ? 'text-42-primary' : 'text-gray-400'}`}>
                      {game.player1_username}
                    </span>
                    <span className="text-gray-500">vs</span>
                    <span className={`font-semibold ${game.winner_username === game.player2_username ? 'text-42-primary' : 'text-gray-400'}`}>
                      {game.player2_username}
                    </span>
                  </div>
                </div>
                <div className="text-xl font-bold text-white">
                  {game.player1_score} - {game.player2_score}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">
            No games played yet. Start playing to see your history!
          </p>
        )}
      </div>
    </div>
  );
}

export default Home;
