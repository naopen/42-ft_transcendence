import { useTranslation } from 'react-i18next';

interface GameResultsProps {
  player1: any;
  player2: any;
  winner: number | null;
  onRematch: () => void;
  onBackToHome: () => void;
}

function GameResults({ player1, player2, winner, onRematch, onBackToHome }: GameResultsProps) {
  const { t } = useTranslation();
  
  const isPlayer1Winner = winner === player1?.id;
  const winnerData = isPlayer1Winner ? player1 : player2;
  const loserData = isPlayer1Winner ? player2 : player1;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-42-gray rounded-2xl shadow-2xl p-8 animate-fadeIn">
        {/* Winner announcement */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-42-primary mb-2 neon-text">
            {t('winner')}
          </h1>
          <p className="text-3xl font-semibold text-white">
            {winnerData?.username}
          </p>
        </div>

        {/* Score display */}
        <div className="flex items-center justify-center space-x-8 mb-8">
          <div className={`text-center ${isPlayer1Winner ? 'order-1' : 'order-3'}`}>
            <p className="text-lg text-gray-400 mb-2">{player1?.username}</p>
            <p className={`text-5xl font-bold ${isPlayer1Winner ? 'text-42-primary' : 'text-gray-500'}`}>
              {player1?.score || 0}
            </p>
          </div>
          
          <div className="order-2 text-gray-500 text-3xl">-</div>
          
          <div className={`text-center ${!isPlayer1Winner ? 'order-1' : 'order-3'}`}>
            <p className="text-lg text-gray-400 mb-2">{player2?.username}</p>
            <p className={`text-5xl font-bold ${!isPlayer1Winner ? 'text-42-primary' : 'text-gray-500'}`}>
              {player2?.score || 0}
            </p>
          </div>
        </div>

        {/* Trophy animation */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center animate-float">
              <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-20"></div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onRematch}
            className="flex-1 btn-primary flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('rematch')}
          </button>
          <button
            onClick={onBackToHome}
            className="flex-1 btn-outline flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {t('backToHome')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameResults;
