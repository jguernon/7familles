import { useState, useEffect, useMemo } from 'react';
import { socket } from '../socket';
import useSounds from '../hooks/useSounds';
import './GameOver.css';

// Générer les confettis
function generateConfetti() {
  const confetti = [];
  const emojis = ['🎉', '🎊', '✨', '🌟', '⭐', '🏆', '👏', '🥳'];
  for (let i = 0; i < 50; i++) {
    confetti.push({
      id: i,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 2,
      size: 20 + Math.random() * 20,
    });
  }
  return confetti;
}

function GameOver({ gameState, playerName, onPlayAgain }) {
  const myId = socket.id;
  const [showDetails, setShowDetails] = useState(false);
  const confetti = useMemo(() => generateConfetti(), []);
  const sounds = useSounds();

  // Jouer le son de fin de partie
  useEffect(() => {
    sounds.playEnd();
  }, [sounds]);

  // Afficher les détails après un délai
  useEffect(() => {
    const timer = setTimeout(() => setShowDetails(true), 2000);
    return () => clearTimeout(timer);
  }, []);

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
    winner = winners[0];
  }

  const isWinner = winner?.id === myId;

  // Récupérer les emojis des familles du gagnant
  const winnerFamilyEmojis = winner?.families.map(f => f.cards[0]?.familyEmoji).filter(Boolean) || [];

  return (
    <div className="game-over-fullscreen">
      {/* Confettis */}
      <div className="confetti-container">
        {confetti.map((c) => (
          <div
            key={c.id}
            className="confetti"
            style={{
              left: `${c.left}%`,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
              fontSize: `${c.size}px`,
            }}
          >
            {c.emoji}
          </div>
        ))}
      </div>

      {/* Annonce du gagnant en plein écran */}
      <div className="winner-announcement">
        <div className="winner-trophy">🏆</div>
        <h1 className="winner-title">
          {isWinner ? 'Victoire!' : 'Partie terminée'}
        </h1>
        <div className="winner-name">
          {isWinner ? 'Félicitations!' : `${winner?.name} remporte la partie!`}
        </div>
        <div className="winner-score">
          {winner?.score} {winner?.score > 1 ? 'familles complétées' : 'famille complétée'}
        </div>
        {winnerFamilyEmojis.length > 0 && (
          <div className="winner-family-emojis">
            {winnerFamilyEmojis.map((emoji, i) => (
              <span key={i} className="winner-emoji">{emoji}</span>
            ))}
          </div>
        )}
      </div>

      {/* Détails qui apparaissent après */}
      <div className={`game-over-details ${showDetails ? 'visible' : ''}`}>
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
                      {family.cards[0]?.familyEmoji} {family.familyName}
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
