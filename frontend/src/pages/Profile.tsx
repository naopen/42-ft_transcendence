import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

interface UserProfile {
  id: number;
  username: string;
  display_name: string;
  email?: string;
  avatar_url: string;
  locale: string;
  created_at: string;
  games_played: number;
  games_won: number;
  games_lost: number;
  total_points_scored: number;
  total_points_conceded: number;
  win_streak: number;
  best_win_streak: number;
}

interface RecentGame {
  id: number;
  player1_username: string;
  player2_username: string;
  player1_score: number;
  player2_score: number;
  winner_username: string;
  created_at: string;
}

function Profile() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const { user: currentUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [loading, setLoading] = useState(true);
  
  const userId = id || currentUser?.id;
  const isOwnProfile = !id || id === currentUser?.id?.toString();

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchRecentGames();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const endpoint = isOwnProfile ? '/users/me' : `/users/${userId}`;
      const response = await api.get(endpoint);
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentGames = async () => {
    try {
      const endpoint = isOwnProfile ? '/users/me/games' : `/users/${userId}/games`;
      const response = await api.get(`${endpoint}?limit=5`);
      setRecentGames(response.data);
    } catch (error) {
      console.error('Error fetching recent games:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Profile not found</p>
      </div>
    );
  }

  const winRate = profile.games_played > 0 
    ? Math.round((profile.games_won / profile.games_played) * 100)
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-42-primary to-42-secondary rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center space-x-6">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="w-24 h-24 rounded-full border-4 border-white shadow-xl"
            />
          ) : (
            <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
              <span className="text-4xl font-bold">
                {profile.username[0].toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold">{profile.display_name || profile.username}</h1>
            <p className="text-lg opacity-90">@{profile.username}</p>
            <p className="text-sm opacity-75 mt-1">
              {t('memberSince')}: {new Date(profile.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-gray-400 text-sm mb-1">{t('gamesPlayed')}</p>
          <p className="text-3xl font-bold text-white">{profile.games_played}</p>
        </div>
        <div className="card text-center">
          <p className="text-gray-400 text-sm mb-1">{t('gamesWon')}</p>
          <p className="text-3xl font-bold text-42-primary">{profile.games_won}</p>
        </div>
        <div className="card text-center">
          <p className="text-gray-400 text-sm mb-1">{t('winRate')}</p>
          <p className="text-3xl font-bold text-white">{winRate}%</p>
        </div>
        <div className="card text-center">
          <p className="text-gray-400 text-sm mb-1">{t('bestWinStreak')}</p>
          <p className="text-3xl font-bold text-42-secondary">{profile.best_win_streak}</p>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="card">
        <h2 className="text-xl font-semibold text-white mb-4">Performance Overview</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-gray-400 text-sm mb-3">Match Statistics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Wins</span>
                <span className="text-green-400 font-semibold">{profile.games_won}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Losses</span>
                <span className="text-red-400 font-semibold">{profile.games_lost}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Current Streak</span>
                <span className="text-42-primary font-semibold">{profile.win_streak} 🔥</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm mb-3">Point Statistics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Scored</span>
                <span className="text-white font-semibold">{profile.total_points_scored}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Conceded</span>
                <span className="text-white font-semibold">{profile.total_points_conceded}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Point Differential</span>
                <span className={`font-semibold ${
                  profile.total_points_scored > profile.total_points_conceded
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}>
                  {profile.total_points_scored - profile.total_points_conceded > 0 ? '+' : ''}
                  {profile.total_points_scored - profile.total_points_conceded}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Games */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">{t('recentGames')}</h2>
          <Link to={`/stats/${userId}`} className="text-42-primary hover:text-white transition-colors">
            View All Stats →
          </Link>
        </div>
        {recentGames.length > 0 ? (
          <div className="space-y-3">
            {recentGames.map((game) => {
              const isWinner = game.winner_username === profile.username;
              const isPlayer1 = game.player1_username === profile.username;
              
              return (
                <div key={game.id} className="bg-42-dark rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-2 h-12 rounded-full ${isWinner ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`font-semibold ${
                            game.player1_username === profile.username ? 'text-42-primary' : 'text-gray-400'
                          }`}>
                            {game.player1_username}
                          </span>
                          <span className="text-gray-500">vs</span>
                          <span className={`font-semibold ${
                            game.player2_username === profile.username ? 'text-42-primary' : 'text-gray-400'
                          }`}>
                            {game.player2_username}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(game.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">
                        {game.player1_score} - {game.player2_score}
                      </p>
                      <p className={`text-sm font-semibold ${isWinner ? 'text-green-400' : 'text-red-400'}`}>
                        {isWinner ? 'Victory' : 'Defeat'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">
            No games played yet
          </p>
        )}
      </div>

      {/* Action Buttons */}
      {isOwnProfile && (
        <div className="flex space-x-4">
          <Link to={`/stats/${userId}`} className="flex-1 btn-primary text-center">
            View Detailed Statistics
          </Link>
          <Link to="/game" className="flex-1 btn-outline text-center">
            Play a Game
          </Link>
        </div>
      )}
    </div>
  );
}

export default Profile;
