import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface CreateTournamentProps {
  onCreateTournament: (name: string, players: string[]) => void;
  loading: boolean;
  error: string | null;
}

function CreateTournament({ onCreateTournament, loading, error }: CreateTournamentProps) {
  const { t } = useTranslation();
  const [tournamentName, setTournamentName] = useState('');
  const [numberOfPlayers, setNumberOfPlayers] = useState(4);
  const [playerAliases, setPlayerAliases] = useState<string[]>(Array(4).fill(''));

  const handleNumberOfPlayersChange = (num: number) => {
    setNumberOfPlayers(num);
    setPlayerAliases(Array(num).fill(''));
  };

  const handlePlayerAliasChange = (index: number, value: string) => {
    const newAliases = [...playerAliases];
    newAliases[index] = value;
    setPlayerAliases(newAliases);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!tournamentName.trim()) {
      alert('Please enter a tournament name');
      return;
    }
    
    const validAliases = playerAliases.filter(alias => alias.trim());
    if (validAliases.length !== numberOfPlayers) {
      alert('Please enter all player aliases');
      return;
    }
    
    // Check for duplicate aliases
    const uniqueAliases = new Set(validAliases);
    if (uniqueAliases.size !== validAliases.length) {
      alert('All player aliases must be unique');
      return;
    }
    
    onCreateTournament(tournamentName, validAliases);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-42-gray rounded-2xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          {t('createTournament')}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tournament Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('tournamentName')}
            </label>
            <input
              type="text"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              className="w-full px-4 py-2 bg-42-dark border border-gray-600 rounded-lg text-white focus:outline-none focus:border-42-primary"
              placeholder="Epic Pong Tournament"
              required
            />
          </div>

          {/* Number of Players */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('numberOfPlayers')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[2, 4, 8, 16].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumberOfPlayersChange(num)}
                  className={`py-2 rounded-lg font-semibold transition-all ${
                    numberOfPlayers === num
                      ? 'bg-42-primary text-white'
                      : 'bg-42-dark text-gray-400 hover:bg-opacity-80'
                  }`}
                >
                  {num} Players
                </button>
              ))}
            </div>
          </div>

          {/* Player Aliases */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Player Aliases
            </label>
            <div className="grid grid-cols-2 gap-3">
              {playerAliases.map((alias, index) => (
                <input
                  key={index}
                  type="text"
                  value={alias}
                  onChange={(e) => handlePlayerAliasChange(index, e.target.value)}
                  className="px-4 py-2 bg-42-dark border border-gray-600 rounded-lg text-white focus:outline-none focus:border-42-primary"
                  placeholder={t('playerAlias', { number: index + 1 })}
                  required
                />
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="spinner mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {t('startTournament')}
              </>
            )}
          </button>
        </form>

        {/* Tournament Rules */}
        <div className="mt-8 p-4 bg-42-dark rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">Tournament Rules</h3>
          <ul className="space-y-1 text-sm text-gray-400">
            <li>• Single elimination format</li>
            <li>• Random initial matchups</li>
            <li>• First to 11 points wins</li>
            <li>• Winners advance to the next round</li>
            <li>• Tournament ends when one player remains</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default CreateTournament;
