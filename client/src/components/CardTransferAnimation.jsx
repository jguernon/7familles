import { useState, useEffect, useRef } from 'react';
import './CardTransferAnimation.css';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

function CardTransferAnimation({ transfer, onComplete }) {
  const [phase, setPhase] = useState('idle');
  const [imageUrl, setImageUrl] = useState(null);
  const [positions, setPositions] = useState({ start: null, end: null });
  const cardRef = useRef(null);

  // Charger l'image de la carte
  useEffect(() => {
    if (transfer?.card) {
      if (transfer.card.image) {
        setImageUrl(transfer.card.image);
      } else {
        // Utiliser l'API qui génère les images à la demande
        setImageUrl(`${SERVER_URL}/api/card-image/${transfer.card.id}`);
      }
    }
  }, [transfer]);

  // Calculer les positions et démarrer l'animation
  useEffect(() => {
    if (!transfer) return;

    // Trouver les éléments DOM pour les positions
    const fromElement = document.querySelector(`[data-player-id="${transfer.fromPlayerId}"]`);
    const toElement = transfer.toHand
      ? document.querySelector('.my-hand')
      : document.querySelector(`[data-player-id="${transfer.toPlayerId}"]`);

    if (fromElement && toElement) {
      const fromRect = fromElement.getBoundingClientRect();
      const toRect = toElement.getBoundingClientRect();

      setPositions({
        start: {
          x: fromRect.left + fromRect.width / 2,
          y: fromRect.top + fromRect.height / 2
        },
        end: {
          x: toRect.left + toRect.width / 2,
          y: toRect.top + toRect.height / 2
        }
      });

      // Démarrer l'animation
      setPhase('lifting');

      const timers = [
        setTimeout(() => setPhase('flying'), 500),
        setTimeout(() => setPhase('landing'), 1200),
        setTimeout(() => {
          setPhase('done');
          onComplete();
        }, 1800)
      ];

      return () => timers.forEach(t => clearTimeout(t));
    } else {
      // Si on ne trouve pas les éléments, terminer immédiatement
      onComplete();
    }
  }, [transfer, onComplete]);

  if (!transfer || phase === 'idle' || !positions.start) return null;

  const getCardStyle = () => {
    const baseStyle = {
      '--start-x': `${positions.start.x}px`,
      '--start-y': `${positions.start.y}px`,
      '--end-x': `${positions.end.x}px`,
      '--end-y': `${positions.end.y}px`,
    };

    return baseStyle;
  };

  return (
    <div className={`card-transfer-overlay ${phase}`}>
      <div
        ref={cardRef}
        className={`transfer-card ${phase}`}
        style={getCardStyle()}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={transfer.card?.memberName}
            onError={(e) => e.target.style.display = 'none'}
          />
        ) : (
          <div className="transfer-card-fallback">
            <span className="emoji">{transfer.card?.memberEmoji}</span>
          </div>
        )}
        <div className="transfer-card-info">
          <span className="member-name">{transfer.card?.memberName}</span>
          <span
            className="family-name"
            style={{ background: transfer.card?.familyColor }}
          >
            {transfer.card?.familyName}
          </span>
        </div>
      </div>
    </div>
  );
}

export default CardTransferAnimation;
