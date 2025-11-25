import { useState } from 'react';
import { socket } from '../socket';
import './Lobby.css';

function Lobby({ gameState, playerName, isHost, onStartGame, onSetReady, error }) {
  const [copied, setCopied] = useState(false);

  const currentPlayer = gameState.players.find(p => p.id === socket.id);
  const isReady = currentPlayer?.ready || false;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(gameState.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback pour mobile
      const input = document.createElement('input');
      input.value = gameState.code;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const allPlayersReady = gameState.players.length >= 2 &&
    gameState.players.every(p => p.ready || p.id === socket.id);

  const canStart = isHost && gameState.players.length >= 2;

  return (
    <div className="lobby">
      <div className="lobby-container fade-in">
        <h1>Salle d'attente</h1>

        <div className="game-code-section">
          <p className="code-label">Code de la partie</p>
          <div className="code-display" onClick={copyCode}>
            <span className="code">{gameState.code}</span>
            <span className="copy-hint">{copied ? 'Copié!' : 'Copier'}</span>
          </div>
          <p className="share-hint">Partagez ce code avec vos amis</p>
        </div>

        <div className="players-section">
          <h2>Joueurs ({gameState.players.length}/6)</h2>
          <ul className="players-list">
            {gameState.players.map((player, index) => (
              <li
                key={player.id}
                className={`player-item ${player.id === socket.id ? 'is-me' : ''} ${player.ready ? 'is-ready' : ''}`}
              >
                <span className="player-avatar">
                  {player.name.charAt(0).toUpperCase()}
                </span>
                <span className="player-name">
                  {player.name}
                  {player.id === gameState.players[0]?.id && (
                    <span className="host-badge">Hôte</span>
                  )}
                  {player.id === socket.id && (
                    <span className="me-badge">Vous</span>
                  )}
                </span>
                <span className={`ready-status ${player.ready ? 'ready' : ''}`}>
                  {player.ready ? '✓ Prêt' : 'En attente'}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="lobby-actions">
          {!isHost && (
            <button
              className={`btn ${isReady ? 'btn-ready' : 'btn-primary'}`}
              onClick={() => onSetReady(!isReady)}
            >
              {isReady ? 'Annuler' : 'Je suis prêt!'}
            </button>
          )}

          {isHost && (
            <button
              className="btn btn-primary btn-start"
              onClick={onStartGame}
              disabled={!canStart}
            >
              {gameState.players.length < 2
                ? 'En attente de joueurs...'
                : 'Démarrer la partie'}
            </button>
          )}
        </div>

        <div className="lobby-rules">
          <h3>Règles du jeu</h3>
          <ul>
            <li>Chaque joueur reçoit 7 cartes</li>
            <li>Demandez une carte à un autre joueur</li>
            <li>Vous devez posséder au moins une carte de la famille demandée</li>
            <li>Si le joueur a la carte, il vous la donne et vous rejouez</li>
            <li>Sinon, vous piochez une carte</li>
            <li>Complétez des familles (6 cartes) pour marquer des points</li>
            <li>Le joueur avec le plus de familles gagne!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Lobby;
