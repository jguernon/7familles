import { socket } from '../socket';
import './GameOver.css';

function GameOver({ gameState, playerName, onPlayAgain }) {
  const myId = socket.id;

  // Calcule les scores (nombre de familles complétées)
  const scores = gameState.players.map(player => ({
    ...player,
    score: (gameState.completedFamilies[player.id] || []).length,
    families: gameState.completedFamilies[player.id] || []
  })).sort((a, b) => b.score - a.score);

  // Détermine le gagnant
  const maxScore = scores[0]?.score || 0;
  const winners = scores.filter(p => p.score === maxScore);

  // En cas d'égalité, celui qui a complété une famille en premier gagne
  let winner = winners[0];
  if (winners.length > 1) {
    // On garde le premier dans la liste (simplifié - le serveur pourrait envoyer plus d'infos)
    winner = winners[0];
  }

  const isWinner = winner?.id === myId;

  return (
    <div className="game-over">
      <div className="game-over-container fade-in">
        <div className={`result-banner ${isWinner ? 'winner' : ''}`}>
          {isWinner ? (
            <>
              <span className="trophy">🏆</span>
              <h1>Victoire!</h1>
              <p>Félicitations, vous avez gagné!</p>
            </>
          ) : (
            <>
              <span className="trophy">🎴</span>
              <h1>Partie terminée</h1>
              <p>{winner?.name} remporte la partie!</p>
            </>
          )}
        </div>

        <div className="scoreboard">
          <h2>Classement final</h2>
          <div className="scores-list">
            {scores.map((player, index) => (
              <div
                key={player.id}
                className={`score-row ${player.id === myId ? 'is-me' : ''} ${index === 0 ? 'first' : ''}`}
              >
                <span className="rank">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                </span>
                <span className="score-player-name">
                  {player.name}
                  {player.id === myId && <span className="me-tag">(vous)</span>}
                </span>
                <span className="score-value">
                  {player.score} {player.score > 1 ? 'familles' : 'famille'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="completed-summary">
          <h3>Familles complétées</h3>
          {scores.map(player => (
            player.families.length > 0 && (
              <div key={player.id} className="player-families">
                <span className="player-families-name">{player.name}:</span>
                <div className="families-badges">
                  {player.families.map(family => (
                    <span
                      key={family.familyId}
                      className="family-badge"
                      style={{ background: family.cards[0]?.familyColor }}
                    >
                      {family.familyName}
                    </span>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>

        <button className="btn btn-primary btn-play-again" onClick={onPlayAgain}>
          Nouvelle partie
        </button>
      </div>
    </div>
  );
}

export default GameOver;
