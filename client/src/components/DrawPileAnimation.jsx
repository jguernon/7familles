import { useState, useEffect, useCallback } from 'react';
import './DrawPileAnimation.css';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

function DrawPileAnimation({ drawnCard, onComplete }) {
  const [phase, setPhase] = useState('idle'); // idle, drawing, flipping, moving, done
  const [imageUrl, setImageUrl] = useState(null);

  const stableOnComplete = useCallback(onComplete, []);

  // Charger l'image depuis le serveur
  useEffect(() => {
    if (drawnCard) {
      if (drawnCard.image) {
        setImageUrl(drawnCard.image);
      } else {
        // Charger depuis le serveur
        setImageUrl(`${SERVER_URL}/images/${drawnCard.id}.png`);
      }
    }
  }, [drawnCard]);

  useEffect(() => {
    if (drawnCard) {
      // Démarrer l'animation
      setPhase('drawing');

      // Séquence d'animation
      const timers = [
        setTimeout(() => setPhase('flipping'), 600),
        setTimeout(() => setPhase('moving'), 1400),
        setTimeout(() => {
          setPhase('done');
          stableOnComplete();
        }, 2200)
      ];

      return () => timers.forEach(t => clearTimeout(t));
    }
  }, [drawnCard, stableOnComplete]);

  if (!drawnCard || phase === 'idle') return null;

  return (
    <div className={`draw-animation-overlay ${phase}`}>
      {/* Paquet de pioche au centre */}
      <div className="draw-pile-container">
        <div className="draw-pile-stack">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="pile-card"
              style={{
                transform: `translateY(${-i * 2}px) translateX(${i * 1}px)`,
                zIndex: i
              }}
            />
          ))}
        </div>

        {/* Carte qui sort du paquet */}
        <div className={`drawn-card ${phase}`}>
          <div className="card-inner">
            <div className="card-back">
              <img src="/cardback.png" alt="Dos de carte" className="card-back-image" />
            </div>
            <div className="card-front">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={drawnCard.memberName}
                  onError={(e) => e.target.style.display = 'none'}
                />
              ) : (
                <div className="card-front-emoji">{drawnCard.memberEmoji}</div>
              )}
              <div className="card-front-info">
                <span className="card-member-name">{drawnCard.memberName}</span>
                <span
                  className="card-family-name"
                  style={{ background: drawnCard.familyColor }}
                >
                  {drawnCard.familyName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DrawPileAnimation;
