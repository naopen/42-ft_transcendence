import { useMemo } from 'react';

interface TournamentBracketProps {
  tournament: any;
  matches: any[];
  players: any[];
}

function TournamentBracket({ tournament, matches, players }: TournamentBracketProps) {
  const rounds = useMemo(() => {
    const roundsMap = new Map<number, any[]>();
    
    matches.forEach((match) => {
      if (!roundsMap.has(match.round)) {
        roundsMap.set(match.round, []);
      }
      roundsMap.get(match.round)?.push(match);
    });
    
    return Array.from(roundsMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([round, matches]) => ({ round, matches }));
  }, [matches]);

  const getMatchStatus = (match: any) => {
    if (match.status === 'completed') {
      return 'bg-green-500 bg-opacity-20 border-green-500';
    } else if (match.status === 'ready') {
      return 'bg-42-primary bg-opacity-20 border-42-primary animate-pulse';
    }
    return 'bg-42-dark border-gray-600';
  };

  return (
    <div className="bg-42-gray rounded-lg p-6 overflow-x-auto">
      <h2 className="text-xl font-semibold text-white mb-4">Tournament Bracket</h2>
      
      <div className="flex space-x-8">
        {rounds.map(({ round, matches }) => (
          <div key={round} className="flex-shrink-0">
            <h3 className="text-center text-gray-400 mb-4">
              Round {round}
            </h3>
            <div className="space-y-4">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className={`border rounded-lg p-4 min-w-[200px] ${getMatchStatus(match)}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={`font-medium ${
                      match.winner_alias === match.player1_alias 
                        ? 'text-42-primary' 
                        : 'text-white'
                    }`}>
                      {match.player1_alias}
                    </span>
                    <span className="text-gray-400">
                      {match.status === 'completed' ? match.player1_score : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${
                      match.winner_alias === match.player2_alias 
                        ? 'text-42-primary' 
                        : match.player2_alias === 'BYE' 
                        ? 'text-gray-500 italic' 
                        : 'text-white'
                    }`}>
                      {match.player2_alias}
                    </span>
                    <span className="text-gray-400">
                      {match.status === 'completed' ? match.player2_score : '-'}
                    </span>
                  </div>
                  {match.status === 'ready' && (
                    <div className="mt-2 text-center">
                      <span className="text-xs text-42-primary">Ready to Play</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {/* Winner */}
        {tournament.winner_alias && (
          <div className="flex-shrink-0">
            <h3 className="text-center text-gray-400 mb-4">Champion</h3>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-4 min-w-[200px]">
              <div className="text-center">
                <div className="text-3xl mb-2">🏆</div>
                <p className="text-white font-bold text-lg">
                  {tournament.winner_alias}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TournamentBracket;
