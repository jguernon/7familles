import { useState, useEffect, useCallback } from 'react';
import { socket } from '../socket';
import Card from './Card';
import AskCardModal from './AskCardModal';
import DrawPileAnimation from './DrawPileAnimation';
import './GameBoard.css';

function GameBoard({ gameState, playerName, onAskCard }) {
  const [showAskModal, setShowAskModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [drawnCard, setDrawnCard] = useState(null);
  const [highlightedCardId, setHighlightedCardId] = useState(null);

  const myId = socket.id;
  const isMyTurn = gameState.isMyTurn;
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  // Affiche les notifications pour les actions
  useEffect(() => {
    if (gameState.lastAction) {
      const action = gameState.lastAction;
      let message = '';

      if (action.type === 'success') {
        message = `${action.asker} a pris le ${action.member} de la famille ${action.family} à ${action.target}!`;
        if (action.familyCompleted) {
          message += ` Famille ${action.familyCompleted} complétée!`;
        }
      } else if (action.type === 'fail') {
        if (action.drewRequestedCard) {
          message = `${action.asker} a pioché le ${action.member} de la famille ${action.family}!`;
          if (action.familyCompleted) {
            message += ` Famille ${action.familyCompleted} complétée!`;
          }
        } else {
          message = `${action.target} n'avait pas le ${action.member}. ${action.asker} a pioché.`;
        }
      }

      // Notification pour nouvelles familles ajoutées
      if (action.newFamiliesAdded && action.newFamiliesAdded.length > 0) {
        message += ` 🎴 Nouvelles familles: ${action.newFamiliesAdded.join(', ')}!`;
      }

      if (message) {
        setNotification(message);
        setTimeout(() => setNotification(null), 5000);
      }
    }
  }, [gameState.lastAction]);

  const [selectedFamily, setSelectedFamily] = useState(null);

  const handleAskFamily = (familyId, familyCards) => {
    if (!isMyTurn) return;
    // On utilise la première carte de la famille pour récupérer les infos
    setSelectedFamily({
      familyId,
      familyName: familyCards[0].familyName,
      familyColor: familyCards[0].familyColor
    });
    setShowAskModal(true);
  };

  const handleAskCard = (targetPlayerId, memberId) => {
    if (!selectedFamily) return;

    setActionFeedback('Demande en cours...');

    onAskCard(targetPlayerId, selectedFamily.familyId, memberId, (response) => {
      setShowAskModal(false);
      setSelectedFamily(null);

      if (response.success) {
        if (response.gotCard) {
          if (response.drewRequestedCard) {
            // On a pioché la carte demandée - animation
            if (response.drawnCard) {
              setDrawnCard(response.drawnCard);
            }
            setActionFeedback('Vous avez pioché la carte demandée! Vous rejouez.');
          } else {
            setActionFeedback('Vous avez obtenu la carte! Vous rejouez.');
          }
        } else {
          // On a pioché une autre carte - animation
          if (response.drawnCard) {
            setDrawnCard(response.drawnCard);
          }
          setActionFeedback('Carte non trouvée. Vous avez pioché.');
        }
      } else {
        setActionFeedback(response.error);
      }

      setTimeout(() => setActionFeedback(null), 3000);
    });
  };

  // Groupe les cartes par famille pour un meilleur affichage
  const groupedCards = gameState.myHand.reduce((acc, card) => {
    if (!acc[card.familyId]) {
      acc[card.familyId] = [];
    }
    acc[card.familyId].push(card);
    return acc;
  }, {});

  return (
    <div className="game-board">
      {/* Header avec infos de partie */}
      <header className="game-header">
        <div className="game-info">
          <span className="draw-pile">Pioche: {gameState.drawPileCount}</span>
          <span className="families-count">Familles: {gameState.families?.length || 0}</span>
          <span className="game-code">#{gameState.code}</span>
        </div>
        <div className={`turn-indicator ${isMyTurn ? 'my-turn' : ''}`}>
          {isMyTurn ? 'Votre tour!' : `Tour de ${currentPlayer?.name || '...'}`}
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className="notification fade-in">
          {notification}
        </div>
      )}

      {/* Feedback d'action */}
      {actionFeedback && (
        <div className="action-feedback fade-in">
          {actionFeedback}
        </div>
      )}

      {/* Zone des autres joueurs */}
      <section className="other-players">
        <h3>Adversaires</h3>
        <div className="players-row">
          {gameState.players
            .filter(p => p.id !== myId)
            .map(player => (
              <div
                key={player.id}
                className={`opponent ${player.id === currentPlayer?.id ? 'active' : ''} ${player.disconnected ? 'disconnected' : ''}`}
              >
                <div className="opponent-avatar">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <span className="opponent-name">{player.name}</span>
                <span className="opponent-cards">
                  {gameState.otherPlayersCardCount[player.id]} cartes
                </span>
                {/* Familles complétées */}
                <div className="opponent-families">
                  {(gameState.completedFamilies[player.id] || []).map(family => (
                    <span
                      key={family.familyId}
                      className="completed-badge"
                      style={{ background: family.cards[0]?.familyColor }}
                      title={family.familyName}
                    >
                      {family.familyName.charAt(0)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* Familles complétées par moi */}
      {gameState.completedFamilies[myId]?.length > 0 && (
        <section className="my-completed-families">
          <h3>Mes familles complétées</h3>
          <div className="completed-families-row">
            {gameState.completedFamilies[myId].map(family => (
              <div
                key={family.familyId}
                className="completed-family"
                style={{ borderColor: family.cards[0]?.familyColor }}
              >
                <span className="family-name">{family.familyName}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ma main */}
      <section className="my-hand">
        <h3>Ma main ({gameState.myHand.length} cartes)</h3>
        {isMyTurn && (
          <p className="hand-hint">Cliquez sur "Demander" pour demander un membre d'une famille</p>
        )}

        <div className="hand-container">
          {Object.entries(groupedCards).map(([familyId, cards]) => (
            <div key={familyId} className="family-group">
              <div className="family-label" style={{ background: cards[0].familyColor }}>
                {cards[0].familyName}
              </div>
              <div className="family-cards">
                {cards.map(card => (
                  <Card
                    key={card.id}
                    card={card}
                    disabled={true}
                    highlighted={card.id === highlightedCardId}
                  />
                ))}
                {isMyTurn && (
                  <button
                    className="ask-card-btn"
                    style={{ '--card-color': cards[0].familyColor }}
                    onClick={() => handleAskFamily(familyId, cards)}
                  >
                    <span className="ask-icon">?</span>
                    <span className="ask-text">Demander</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {gameState.myHand.length === 0 && (
            <p className="no-cards">Vous n'avez plus de cartes</p>
          )}
        </div>
      </section>

      {/* Modal pour demander une carte */}
      {showAskModal && selectedFamily && (
        <AskCardModal
          selectedFamily={selectedFamily}
          players={gameState.players.filter(p => p.id !== myId && !p.disconnected)}
          members={gameState.members}
          myHand={gameState.myHand}
          onAsk={handleAskCard}
          onClose={() => {
            setShowAskModal(false);
            setSelectedFamily(null);
          }}
        />
      )}

      {/* Animation de pioche */}
      {drawnCard && (
        <DrawPileAnimation
          drawnCard={drawnCard}
          onComplete={() => {
            // Highlight la carte dans la main pendant quelques secondes
            setHighlightedCardId(drawnCard.id);
            setDrawnCard(null);
            setTimeout(() => setHighlightedCardId(null), 3000);
          }}
        />
      )}
    </div>
  );
}

export default GameBoard;
