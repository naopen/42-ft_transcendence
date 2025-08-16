import { useTranslation } from 'react-i18next';

interface GameMatchmakingProps {
  onStartMatchmaking: () => void;
  loading: boolean;
  error: string | null;
}

function GameMatchmaking({ onStartMatchmaking, loading, error }: GameMatchmakingProps) {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-42-gray rounded-2xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          {t('play')} Pong
        </h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Online Match */}
          <div className="bg-42-dark rounded-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-42-primary bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-42-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2 text-center">
              Online Match
            </h2>
            <p className="text-gray-400 text-center mb-4">
              Play against other players online in real-time
            </p>
            <button
              onClick={onStartMatchmaking}
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="spinner mr-2"></div>
                  {t('waitingForOpponent')}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('matchmaking')}
                </>
              )}
            </button>
          </div>

          {/* Practice Mode */}
          <div className="bg-42-dark rounded-lg p-6 hover:shadow-xl transition-shadow opacity-50">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gray-600 bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-500 mb-2 text-center">
              Practice Mode
            </h2>
            <p className="text-gray-600 text-center mb-4">
              Practice against AI (Coming Soon)
            </p>
            <button
              disabled
              className="w-full bg-gray-700 text-gray-500 px-6 py-3 rounded-lg font-semibold cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
            <p className="text-red-500 text-center">{error}</p>
          </div>
        )}

        {/* Game Features */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-42-primary text-3xl font-bold mb-1">3D</div>
            <p className="text-gray-400 text-sm">Babylon.js Graphics</p>
          </div>
          <div className="text-center">
            <div className="text-42-primary text-3xl font-bold mb-1">60fps</div>
            <p className="text-gray-400 text-sm">Smooth Gameplay</p>
          </div>
          <div className="text-center">
            <div className="text-42-primary text-3xl font-bold mb-1">Live</div>
            <p className="text-gray-400 text-sm">Real-time Multiplayer</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameMatchmaking;
