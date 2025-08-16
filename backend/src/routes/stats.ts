import { FastifyPluginAsync } from 'fastify';
import { db } from '../database/init';

const statsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get user statistics
  fastify.get('/user/:id', async (request) => {
    const { id } = request.params as { id: string };

    // Basic stats
    const stats = db.prepare(`
      SELECT * FROM user_stats WHERE user_id = ?
    `).get(id);

    if (!stats) {
      throw { statusCode: 404, message: 'User statistics not found' };
    }

    // Recent performance (last 10 games)
    const recentGames = db.prepare(`
      SELECT
        g.id,
        g.player1_id,
        g.player2_id,
        g.player1_score,
        g.player2_score,
        g.winner_id,
        g.duration,
        g.ended_at,
        CASE
          WHEN g.winner_id = ? THEN 'won'
          ELSE 'lost'
        END as result
      FROM games g
      WHERE (g.player1_id = ? OR g.player2_id = ?)
      AND g.status = 'completed'
      ORDER BY g.ended_at DESC
      LIMIT 10
    `).all(id, id, id);

    // Calculate win rate over time (monthly)
    const monthlyStats = db.prepare(`
      SELECT
        strftime('%Y-%m', ended_at) as month,
        COUNT(*) as games_played,
        SUM(CASE WHEN winner_id = ? THEN 1 ELSE 0 END) as games_won,
        AVG(CASE
          WHEN player1_id = ? THEN player1_score
          ELSE player2_score
        END) as avg_score
      FROM games
      WHERE (player1_id = ? OR player2_id = ?)
      AND status = 'completed'
      AND ended_at IS NOT NULL
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `).all(id, id, id, id);

    // Head-to-head records
    const headToHead = db.prepare(`
      SELECT
        CASE
          WHEN g.player1_id = ? THEN u2.id
          ELSE u1.id
        END as opponent_id,
        CASE
          WHEN g.player1_id = ? THEN u2.username
          ELSE u1.username
        END as opponent_username,
        COUNT(*) as games_played,
        SUM(CASE WHEN g.winner_id = ? THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN g.winner_id != ? AND g.winner_id IS NOT NULL THEN 1 ELSE 0 END) as losses
      FROM games g
      JOIN users u1 ON g.player1_id = u1.id
      JOIN users u2 ON g.player2_id = u2.id
      WHERE (g.player1_id = ? OR g.player2_id = ?)
      AND g.status = 'completed'
      GROUP BY opponent_id, opponent_username
      ORDER BY games_played DESC
      LIMIT 10
    `).all(id, id, id, id, id, id);

    // Game duration statistics
    const durationStats = db.prepare(`
      SELECT
        AVG(duration) as avg_duration,
        MIN(duration) as min_duration,
        MAX(duration) as max_duration
      FROM games
      WHERE (player1_id = ? OR player2_id = ?)
      AND status = 'completed'
      AND duration IS NOT NULL
    `).get(id, id);

    // Score statistics
    const scoreStats = db.prepare(`
      SELECT
        AVG(CASE
          WHEN player1_id = ? THEN player1_score
          ELSE player2_score
        END) as avg_points_scored,
        AVG(CASE
          WHEN player1_id = ? THEN player2_score
          ELSE player1_score
        END) as avg_points_conceded,
        MAX(CASE
          WHEN player1_id = ? THEN player1_score
          ELSE player2_score
        END) as max_points_scored
      FROM games
      WHERE (player1_id = ? OR player2_id = ?)
      AND status = 'completed'
    `).get(id, id, id, id, id);

    return {
      basic: stats,
      recentPerformance: recentGames,
      monthlyStats,
      headToHead,
      durationStats,
      scoreStats
    };
  });

  // Get global statistics
  fastify.get('/global', async () => {
    const totalGames = db.prepare(`
      SELECT COUNT(*) as count FROM games WHERE status = 'completed'
    `).get() as { count: number };

    const totalPlayers = db.prepare(`
      SELECT COUNT(*) as count FROM users
    `).get() as { count: number };

    const activePlayers = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM (
        SELECT player1_id as user_id FROM games
        WHERE ended_at > datetime('now', '-30 days')
        UNION
        SELECT player2_id as user_id FROM games
        WHERE ended_at > datetime('now', '-30 days')
      )
    `).get() as { count: number };

    const avgGameDuration = db.prepare(`
      SELECT AVG(duration) as avg_duration
      FROM games
      WHERE status = 'completed' AND duration IS NOT NULL
    `).get() as { avg_duration: number };

    const topScorers = db.prepare(`
      SELECT
        u.id,
        u.username,
        u.display_name,
        u.avatar_url,
        s.total_points_scored,
        s.games_played,
        CAST(s.total_points_scored AS REAL) / NULLIF(s.games_played, 0) as avg_score
      FROM users u
      JOIN user_stats s ON u.id = s.user_id
      WHERE s.games_played > 5
      ORDER BY avg_score DESC
      LIMIT 5
    `).all();

    const winStreakLeaders = db.prepare(`
      SELECT
        u.id,
        u.username,
        u.display_name,
        u.avatar_url,
        s.best_win_streak
      FROM users u
      JOIN user_stats s ON u.id = s.user_id
      WHERE s.best_win_streak > 0
      ORDER BY s.best_win_streak DESC
      LIMIT 5
    `).all();

    const mostActiveToday = db.prepare(`
      SELECT
        u.id,
        u.username,
        u.display_name,
        COUNT(*) as games_today
      FROM (
        SELECT player1_id as user_id FROM games
        WHERE DATE(created_at) = DATE('now')
        UNION ALL
        SELECT player2_id as user_id FROM games
        WHERE DATE(created_at) = DATE('now')
      ) g
      JOIN users u ON g.user_id = u.id
      GROUP BY u.id, u.username, u.display_name
      ORDER BY games_today DESC
      LIMIT 5
    `).all();

    return {
      totalGames: totalGames.count,
      totalPlayers: totalPlayers.count,
      activePlayers: activePlayers.count,
      avgGameDuration: avgGameDuration.avg_duration,
      topScorers,
      winStreakLeaders,
      mostActiveToday
    };
  });

  // Get tournament statistics
  fastify.get('/tournament/:id', async (request) => {
    const { id } = request.params as { id: string };

    const tournament = db.prepare(`
      SELECT * FROM tournaments WHERE id = ?
    `).get(id);

    if (!tournament) {
      throw { statusCode: 404, message: 'Tournament not found' };
    }

    // Get match statistics
    const matchStats = db.prepare(`
      SELECT
        round,
        COUNT(*) as total_matches,
        AVG(player1_score + player2_score) as avg_total_score,
        MAX(player1_score + player2_score) as highest_scoring_match,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_matches
      FROM tournament_games
      WHERE tournament_id = ?
      GROUP BY round
      ORDER BY round
    `).all(id);

    // Get player performance
    const playerPerformance = db.prepare(`
      SELECT
        tp.alias,
        tp.eliminated_round,
        COUNT(tg.id) as matches_played,
        SUM(CASE WHEN tg.winner_alias = tp.alias THEN 1 ELSE 0 END) as matches_won,
        SUM(CASE
          WHEN tg.player1_alias = tp.alias THEN tg.player1_score
          WHEN tg.player2_alias = tp.alias THEN tg.player2_score
          ELSE 0
        END) as total_score
      FROM tournament_players tp
      LEFT JOIN tournament_games tg ON
        (tg.player1_alias = tp.alias OR tg.player2_alias = tp.alias)
        AND tg.tournament_id = tp.tournament_id
      WHERE tp.tournament_id = ?
      GROUP BY tp.alias, tp.eliminated_round
      ORDER BY matches_won DESC, total_score DESC
    `).all(id);

    return {
      tournament,
      matchStats,
      playerPerformance
    };
  });
};

export default statsRoutes;
