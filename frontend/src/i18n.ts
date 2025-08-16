import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      home: 'Home',
      play: 'Play',
      tournament: 'Tournament',
      leaderboard: 'Leaderboard',
      profile: 'Profile',
      logout: 'Logout',
      login: 'Login',
      
      // Auth
      signInWithGoogle: 'Sign in with Google',
      welcomeBack: 'Welcome back',
      signInToContinue: 'Sign in to continue',
      
      // Game
      matchmaking: 'Find Match',
      createTournament: 'Create Tournament',
      joinTournament: 'Join Tournament',
      spectate: 'Spectate',
      score: 'Score',
      winner: 'Winner',
      duration: 'Duration',
      rematch: 'Rematch',
      backToHome: 'Back to Home',
      waitingForOpponent: 'Waiting for opponent...',
      gameStarting: 'Game starting in',
      controls: 'Controls',
      moveUp: 'Move Up',
      moveDown: 'Move Down',
      pause: 'Pause',
      
      // Tournament
      tournamentName: 'Tournament Name',
      numberOfPlayers: 'Number of Players',
      playerAlias: 'Player {{number}} Alias',
      startTournament: 'Start Tournament',
      currentRound: 'Round {{round}}',
      nextMatch: 'Next Match',
      tournamentWinner: 'Tournament Winner',
      bracket: 'Bracket',
      
      // Stats
      statistics: 'Statistics',
      gamesPlayed: 'Games Played',
      gamesWon: 'Games Won',
      gamesLost: 'Games Lost',
      winRate: 'Win Rate',
      winStreak: 'Win Streak',
      bestWinStreak: 'Best Win Streak',
      averageScore: 'Average Score',
      totalPointsScored: 'Total Points Scored',
      totalPointsConceded: 'Total Points Conceded',
      recentGames: 'Recent Games',
      monthlyPerformance: 'Monthly Performance',
      headToHead: 'Head to Head',
      
      // Profile
      userProfile: 'User Profile',
      editProfile: 'Edit Profile',
      changeLanguage: 'Change Language',
      memberSince: 'Member Since',
      
      // Errors
      errorOccurred: 'An error occurred',
      tryAgain: 'Try Again',
      connectionLost: 'Connection Lost',
      reconnecting: 'Reconnecting...',
    }
  },
  ja: {
    translation: {
      // Navigation
      home: 'ホーム',
      play: 'プレイ',
      tournament: 'トーナメント',
      leaderboard: 'リーダーボード',
      profile: 'プロフィール',
      logout: 'ログアウト',
      login: 'ログイン',
      
      // Auth
      signInWithGoogle: 'Googleでサインイン',
      welcomeBack: 'おかえりなさい',
      signInToContinue: '続けるにはサインインしてください',
      
      // Game
      matchmaking: 'マッチを探す',
      createTournament: 'トーナメントを作成',
      joinTournament: 'トーナメントに参加',
      spectate: '観戦',
      score: 'スコア',
      winner: '勝者',
      duration: '試合時間',
      rematch: '再戦',
      backToHome: 'ホームに戻る',
      waitingForOpponent: '対戦相手を待っています...',
      gameStarting: 'ゲーム開始まで',
      controls: 'コントロール',
      moveUp: '上に移動',
      moveDown: '下に移動',
      pause: '一時停止',
      
      // Tournament
      tournamentName: 'トーナメント名',
      numberOfPlayers: 'プレイヤー数',
      playerAlias: 'プレイヤー {{number}} の名前',
      startTournament: 'トーナメント開始',
      currentRound: '第{{round}}ラウンド',
      nextMatch: '次の試合',
      tournamentWinner: 'トーナメント優勝者',
      bracket: 'トーナメント表',
      
      // Stats
      statistics: '統計',
      gamesPlayed: '試合数',
      gamesWon: '勝利数',
      gamesLost: '敗北数',
      winRate: '勝率',
      winStreak: '連勝中',
      bestWinStreak: '最高連勝記録',
      averageScore: '平均スコア',
      totalPointsScored: '総得点',
      totalPointsConceded: '総失点',
      recentGames: '最近の試合',
      monthlyPerformance: '月別パフォーマンス',
      headToHead: '対戦成績',
      
      // Profile
      userProfile: 'ユーザープロフィール',
      editProfile: 'プロフィールを編集',
      changeLanguage: '言語を変更',
      memberSince: '登録日',
      
      // Errors
      errorOccurred: 'エラーが発生しました',
      tryAgain: 'もう一度試す',
      connectionLost: '接続が失われました',
      reconnecting: '再接続中...',
    }
  },
  fr: {
    translation: {
      // Navigation
      home: 'Accueil',
      play: 'Jouer',
      tournament: 'Tournoi',
      leaderboard: 'Classement',
      profile: 'Profil',
      logout: 'Déconnexion',
      login: 'Connexion',
      
      // Auth
      signInWithGoogle: 'Se connecter avec Google',
      welcomeBack: 'Bon retour',
      signInToContinue: 'Connectez-vous pour continuer',
      
      // Game
      matchmaking: 'Trouver un match',
      createTournament: 'Créer un tournoi',
      joinTournament: 'Rejoindre un tournoi',
      spectate: 'Observer',
      score: 'Score',
      winner: 'Gagnant',
      duration: 'Durée',
      rematch: 'Revanche',
      backToHome: "Retour à l'accueil",
      waitingForOpponent: "En attente d'un adversaire...",
      gameStarting: 'Le jeu commence dans',
      controls: 'Contrôles',
      moveUp: 'Monter',
      moveDown: 'Descendre',
      pause: 'Pause',
      
      // Tournament
      tournamentName: 'Nom du tournoi',
      numberOfPlayers: 'Nombre de joueurs',
      playerAlias: 'Nom du joueur {{number}}',
      startTournament: 'Démarrer le tournoi',
      currentRound: 'Tour {{round}}',
      nextMatch: 'Prochain match',
      tournamentWinner: 'Vainqueur du tournoi',
      bracket: 'Tableau',
      
      // Stats
      statistics: 'Statistiques',
      gamesPlayed: 'Parties jouées',
      gamesWon: 'Parties gagnées',
      gamesLost: 'Parties perdues',
      winRate: 'Taux de victoire',
      winStreak: 'Série de victoires',
      bestWinStreak: 'Meilleure série',
      averageScore: 'Score moyen',
      totalPointsScored: 'Points marqués',
      totalPointsConceded: 'Points encaissés',
      recentGames: 'Parties récentes',
      monthlyPerformance: 'Performance mensuelle',
      headToHead: 'Face à face',
      
      // Profile
      userProfile: 'Profil utilisateur',
      editProfile: 'Modifier le profil',
      changeLanguage: 'Changer la langue',
      memberSince: 'Membre depuis',
      
      // Errors
      errorOccurred: 'Une erreur est survenue',
      tryAgain: 'Réessayer',
      connectionLost: 'Connexion perdue',
      reconnecting: 'Reconnexion...',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
