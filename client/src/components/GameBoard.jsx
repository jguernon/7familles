import { useState, useEffect, useCallback, useRef } from 'react';
import { socket } from '../socket';
import Card from './Card';
import AskCardModal from './AskCardModal';
import DrawPileAnimation from './DrawPileAnimation';
import CardTransferAnimation from './CardTransferAnimation';
import FamilyCompleteAnimation from './FamilyCompleteAnimation';
import CardLostAnimation from './CardLostAnimation';
import useSounds from '../hooks/useSounds';
import './GameBoard.css';

function GameBoard({ gameState, playerName, onAskCard }) {
  const [showAskModal, setShowAskModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [drawnCard, setDrawnCard] = useState(null);
  const [highlightedCardId, setHighlightedCardId] = useState(null);
  const [cardTransfer, setCardTransfer] = useState(null);
  const [familyComplete, setFamilyComplete] = useState(null);
  const [lostCard, setLostCard] = useState(null);

  const sounds = useSounds();
  const prevCompletedFamiliesRef = useRef(gameState.completedFamilies);
  const lastProcessedActionRef = useRef(null);

  const myId = socket.id;
  const isMyTurn = gameState.isMyTurn;
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  // Gérer le son d'attente quand ce n'est pas notre tour
  useEffect(() => {
    if (!isMyTurn) {
      sounds.startWaiting();
    } else {
      sounds.stopWaiting();
    }
    return () => sounds.stopWaiting();
  }, [isMyTurn, sounds]);

  // Détecter quand une nouvelle famille est complétée (par moi)
  useEffect(() => {
    const myCompletedFamilies = gameState.completedFamilies[myId] || [];
    const prevMyCompletedFamilies = prevCompletedFamiliesRef.current[myId] || [];

    if (myCompletedFamilies.length > prevMyCompletedFamilies.length) {
      // Une nouvelle famille a été complétée par moi
      const newFamily = myCompletedFamilies[myCompletedFamilies.length - 1];
      sounds.playWin();
      setFamilyComplete({
        familyEmoji: newFamily.cards[0]?.familyEmoji,
        familyName: newFamily.familyName,
        familyColor: newFamily.cards[0]?.familyColor
      });
    }

    prevCompletedFamiliesRef.current = gameState.completedFamilies;
  }, [gameState.completedFamilies, myId, sounds]);

  // Affiche les notifications et animations pour les actions des autres joueurs
  useEffect(() => {
    if (gameState.lastAction) {
      const action = gameState.lastAction;

      // Éviter de traiter la même action plusieurs fois
      const actionId = `${action.type}-${action.asker}-${action.target}-${action.family}-${action.member}-${action.timestamp || Date.now()}`;
      if (lastProcessedActionRef.current === actionId) {
        return;
      }
      lastProcessedActionRef.current = actionId;

      let message = '';

      if (action.type === 'success') {
        message = `${action.asker} a pris le ${action.member} de la famille ${action.family} à ${action.target}!`;
        if (action.familyCompleted) {
          message += ` Famille ${action.familyCompleted} complétée!`;
        }

        // Animation et son si on se fait voler une carte
        if (action.targetId === myId && action.card) {
          sounds.playStolen();
          setLostCard(action.card);
        }

        // Animation de transfert pour les autres joueurs (pas celui qui a fait l'action)
        if (action.askerId !== myId && action.card) {
          setCardTransfer({
            card: action.card,
            fromPlayerId: action.targetId,
            toPlayerId: action.askerId,
            toHand: action.askerId === myId
          });
        }
      } else if (action.type === 'fail') {
        if (action.drewRequestedCard) {
          message = `${action.asker} a pigé le ${action.member} de la famille ${action.family}!`;
          if (action.familyCompleted) {
            message += ` Famille ${action.familyCompleted} complétée!`;
          }
        } else {
          message = `${action.target} n'avait pas le ${action.member}. ${action.asker} a pigé.`;
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
  }, [gameState.lastAction, myId, sounds]);

  const [selectedFamily, setSelectedFamily] = useState(null);

  const handleAskFamily = (familyId, familyCards) => {
    if (!isMyTurn) return;
    // On utilise la première carte de la famille pour récupérer les infos
    setSelectedFamily({
      familyId,
      familyName: familyCards[0].familyName,
      familyColor: familyCards[0].familyColor,
      familyEmoji: familyCards[0].familyEmoji
    });
    setShowAskModal(true);
  };

  // Ouvrir le modal pour demander N'IMPORTE quelle famille
  const handleAskAnyFamily = () => {
    if (!isMyTurn) return;
    setSelectedFamily(null); // null = choisir famille d'abord
    setShowAskModal(true);
  };

  const handleAskCard = (targetPlayerId, memberId, familyId) => {
    const familyToUse = familyId || selectedFamily?.familyId;
    if (!familyToUse) return;

    setActionFeedback('Demande en cours...');

    onAskCard(targetPlayerId, familyToUse, memberId, (response) => {
      setShowAskModal(false);
      setSelectedFamily(null);

      if (response.success) {
        if (response.gotCard) {
          if (response.drewRequestedCard) {
            // On a pigé la carte demandée - animation de pige
            sounds.playPige();
            if (response.drawnCard) {
              setDrawnCard(response.drawnCard);
            }
            setActionFeedback('Vous avez pigé la carte demandée! Vous rejouez.');
          } else if (response.stolenCard && response.fromPlayerId) {
            // On a volé la carte à un adversaire - animation de transfert
            sounds.playGotCard();
            setCardTransfer({
              card: response.stolenCard,
              fromPlayerId: response.fromPlayerId,
              toHand: true // vers notre main
            });
            setActionFeedback('Vous avez obtenu la carte! Vous rejouez.');
          } else {
            sounds.playGotCard();
            setActionFeedback('Vous avez obtenu la carte! Vous rejouez.');
          }
        } else {
          // On a pigé une autre carte - animation de pige
          sounds.playPige();
          if (response.drawnCard) {
            setDrawnCard(response.drawnCard);
          }
          setActionFeedback('Carte non trouvée. Vous avez pigé.');
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

  // Partager le lien de la partie
  const handleShareGame = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?code=${gameState.code}`;
    const shareData = {
      title: 'Jeu des 7 Familles',
      text: `Rejoins ma partie des 7 Familles ! Code: ${gameState.code}`,
      url: shareUrl
    };

    // Vérifier si Web Share API est disponible et peut partager ces données
    const canUseShare = navigator.share && navigator.canShare && navigator.canShare(shareData);

    if (canUseShare) {
      try {
        await navigator.share(shareData);
        return; // Partage réussi
      } catch (err) {
        // Si l'utilisateur a annulé, ne rien faire
        if (err.name === 'AbortError') return;
        // Sinon, fallback au clipboard
      }
    }

    // Fallback: copier le lien dans le presse-papier
    try {
      await navigator.clipboard.writeText(shareUrl);
      setActionFeedback('Lien copié !');
      setTimeout(() => setActionFeedback(null), 2000);
    } catch {
      // Dernier recours si clipboard ne fonctionne pas
      setActionFeedback(`Code: ${gameState.code}`);
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  return (
    <div className="game-board">
      {/* Header avec infos de partie */}
      <header className="game-header">
        <div className="game-info">
          <span className="draw-pile">Pige: {gameState.drawPileCount}</span>
          <span className="families-count">Familles: {gameState.families?.length || 0}</span>
          <span className="game-code" onClick={handleShareGame}>#{gameState.code}</span>
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
                data-player-id={player.id}
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

          {/* Bouton pour demander une autre famille - temporairement désactivé */}
          {/* {isMyTurn && (
            <button
              className="ask-any-family-btn"
              onClick={handleAskAnyFamily}
            >
              <span className="ask-any-icon">🎴</span>
              <span className="ask-any-text">Demander une autre famille</span>
            </button>
          )} */}
        </div>
      </section>

      {/* Modal pour demander une carte */}
      {showAskModal && (
        <AskCardModal
          selectedFamily={selectedFamily}
          allFamilies={gameState.families}
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
          families={gameState.families}
          onComplete={() => {
            // Highlight la carte dans la main pendant quelques secondes
            setHighlightedCardId(drawnCard.id);
            setDrawnCard(null);
            setTimeout(() => setHighlightedCardId(null), 3000);
          }}
        />
      )}

      {/* Animation de transfert de carte */}
      {cardTransfer && (
        <CardTransferAnimation
          transfer={cardTransfer}
          onComplete={() => {
            // Si la carte va vers notre main, la highlight
            if (cardTransfer.toHand && cardTransfer.card) {
              setHighlightedCardId(cardTransfer.card.id);
              setTimeout(() => setHighlightedCardId(null), 3000);
            }
            setCardTransfer(null);
          }}
        />
      )}

      {/* Animation de famille complète */}
      {familyComplete && (
        <FamilyCompleteAnimation
          familyEmoji={familyComplete.familyEmoji}
          familyName={familyComplete.familyName}
          familyColor={familyComplete.familyColor}
          onComplete={() => setFamilyComplete(null)}
        />
      )}

      {/* Animation de carte perdue (volée) */}
      {lostCard && (
        <CardLostAnimation
          card={lostCard}
          onComplete={() => setLostCard(null)}
        />
      )}

      {/* Barre de tour fixe en bas */}
      <div className={`turn-bar ${isMyTurn ? 'my-turn' : ''}`}>
        <div className="turn-bar-content">
          {isMyTurn ? (
            'Votre tour!'
          ) : (
            <>
              Tour de {currentPlayer?.name || '...'}
              <span className="waiting-dots">
                <span className="dot">.</span>
                <span className="dot">.</span>
                <span className="dot">.</span>
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default GameBoard;
