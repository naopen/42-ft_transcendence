import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import api from '../services/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface UserStats {
  basic: {
    games_played: number;
    games_won: number;
    games_lost: number;
    total_points_scored: number;
    total_points_conceded: number;
    win_streak: number;
    best_win_streak: number;
  };
  recentPerformance: Array<{
    id: number;
    result: 'won' | 'lost';
    player1_score: number;
    player2_score: number;
    ended_at: string;
  }>;
  monthlyStats: Array<{
    month: string;
    games_played: number;
    games_won: number;
    avg_score: number;
  }>;
  headToHead: Array<{
    opponent_id: number;
    opponent_username: string;
    games_played: number;
    wins: number;
    losses: number;
  }>;
  durationStats: {
    avg_duration: number;
    min_duration: number;
    max_duration: number;
  };
  scoreStats: {
    avg_points_scored: number;
    avg_points_conceded: number;
    max_points_scored: number;
  };
}

function Stats() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  const userId = id || user?.id;

  useEffect(() => {
    if (userId) {
      fetchStats();
    }
  }, [userId]);

  const fetchStats = async () => {
    try {
      const response = await api.get(`/stats/user/${userId}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No statistics available</p>
      </div>
    );
  }

  // Prepare chart data
  const winRateData = {
    labels: ['Won', 'Lost'],
    datasets: [{
      data: [stats.basic.games_won, stats.basic.games_lost],
      backgroundColor: ['#00BABC', '#FF6B6B'],
      borderColor: ['#00BABC', '#FF6B6B'],
      borderWidth: 2,
    }],
  };

  const monthlyPerformanceData = {
    labels: stats.monthlyStats.map(m => m.month),
    datasets: [
      {
        label: 'Games Won',
        data: stats.monthlyStats.map(m => m.games_won),
        borderColor: '#00BABC',
        backgroundColor: 'rgba(0, 186, 188, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Games Played',
        data: stats.monthlyStats.map(m => m.games_played),
        borderColor: '#FF6B6B',
        backgroundColor: 'rgba(255, 107, 107, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const recentFormData = {
    labels: stats.recentPerformance.map((_, i) => `Game ${i + 1}`).reverse(),
    datasets: [{
      label: 'Recent Games',
      data: stats.recentPerformance.map(g => g.result === 'won' ? 1 : 0).reverse(),
      backgroundColor: stats.recentPerformance.map(g => 
        g.result === 'won' ? '#00BABC' : '#FF6B6B'
      ).reverse(),
      borderRadius: 4,
    }],
  };

  const chartOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#F5F5F5',
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#F5F5F5',
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#F5F5F5',
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-42-primary to-42-secondary rounded-2xl p-8 text-white shadow-2xl">
        <h1 className="text-4xl font-bold mb-2">{t('statistics')}</h1>
        <p className="text-lg opacity-90">Detailed performance analytics</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-gray-400 text-sm mb-1">{t('gamesPlayed')}</p>
          <p className="text-3xl font-bold text-white">{stats.basic.games_played}</p>
        </div>
        <div className="card text-center">
          <p className="text-gray-400 text-sm mb-1">{t('winRate')}</p>
          <p className="text-3xl font-bold text-42-primary">
            {stats.basic.games_played > 0 
              ? Math.round((stats.basic.games_won / stats.basic.games_played) * 100)
              : 0}%
          </p>
        </div>
        <div className="card text-center">
          <p className="text-gray-400 text-sm mb-1">{t('winStreak')}</p>
          <p className="text-3xl font-bold text-white">{stats.basic.win_streak} 🔥</p>
        </div>
        <div className="card text-center">
          <p className="text-gray-400 text-sm mb-1">{t('bestWinStreak')}</p>
          <p className="text-3xl font-bold text-42-secondary">{stats.basic.best_win_streak}</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Win/Loss Ratio */}
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-4">Win/Loss Distribution</h2>
          <div style={{ height: '250px' }}>
            <Doughnut data={winRateData} options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                legend: {
                  position: 'bottom',
                  labels: {
                    color: '#F5F5F5',
                  },
                },
              },
            }} />
          </div>
        </div>

        {/* Recent Form */}
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Form (Last 10)</h2>
          <div style={{ height: '250px' }}>
            <Bar data={recentFormData} options={{
              ...chartOptions,
              scales: {
                ...chartOptions.scales,
                y: {
                  ...chartOptions.scales?.y,
                  max: 1,
                  ticks: {
                    callback: (value: any) => value === 1 ? 'Won' : 'Lost',
                    color: '#F5F5F5',
                  },
                },
              },
            }} />
          </div>
        </div>
      </div>

      {/* Monthly Performance */}
      <div className="card">
        <h2 className="text-xl font-semibold text-white mb-4">{t('monthlyPerformance')}</h2>
        <div style={{ height: '300px' }}>
          <Line data={monthlyPerformanceData} options={chartOptions} />
        </div>
      </div>

      {/* Score Statistics */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-3">Scoring</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Points Scored</span>
              <span className="text-white font-semibold">
                {stats.scoreStats.avg_points_scored?.toFixed(1) || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Points Conceded</span>
              <span className="text-white font-semibold">
                {stats.scoreStats.avg_points_conceded?.toFixed(1) || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Max Points Scored</span>
              <span className="text-42-primary font-semibold">
                {stats.scoreStats.max_points_scored || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-3">Game Duration</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Average</span>
              <span className="text-white font-semibold">
                {Math.round(stats.durationStats.avg_duration / 60) || 0} min
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Shortest</span>
              <span className="text-white font-semibold">
                {Math.round(stats.durationStats.min_duration / 60) || 0} min
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Longest</span>
              <span className="text-white font-semibold">
                {Math.round(stats.durationStats.max_duration / 60) || 0} min
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-3">Points Analysis</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Scored</span>
              <span className="text-42-primary font-semibold">
                {stats.basic.total_points_scored}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Conceded</span>
              <span className="text-42-secondary font-semibold">
                {stats.basic.total_points_conceded}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Point Differential</span>
              <span className={`font-semibold ${
                stats.basic.total_points_scored > stats.basic.total_points_conceded
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}>
                {stats.basic.total_points_scored - stats.basic.total_points_conceded > 0 ? '+' : ''}
                {stats.basic.total_points_scored - stats.basic.total_points_conceded}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Head to Head Records */}
      {stats.headToHead.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-4">{t('headToHead')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 text-gray-400">Opponent</th>
                  <th className="text-center py-2 text-gray-400">Played</th>
                  <th className="text-center py-2 text-gray-400">Won</th>
                  <th className="text-center py-2 text-gray-400">Lost</th>
                  <th className="text-center py-2 text-gray-400">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {stats.headToHead.map((record) => (
                  <tr key={record.opponent_id} className="border-b border-gray-800">
                    <td className="py-2 text-white">{record.opponent_username}</td>
                    <td className="text-center py-2 text-gray-300">{record.games_played}</td>
                    <td className="text-center py-2 text-green-400">{record.wins}</td>
                    <td className="text-center py-2 text-red-400">{record.losses}</td>
                    <td className="text-center py-2">
                      <span className={`font-semibold ${
                        record.wins > record.losses ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {Math.round((record.wins / record.games_played) * 100)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Stats;
