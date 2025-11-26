import { useState, useEffect, useCallback } from 'react';
import './DrawPileAnimation.css';

function DrawPileAnimation({ drawnCard, onComplete, families = [] }) {
  const [phase, setPhase] = useState('idle'); // idle, drawing, flipping, moving, done

  const stableOnComplete = useCallback(onComplete, []);

  useEffect(() => {
    if (drawnCard) {
      // Démarrer l'animation
      setPhase('drawing');

      // Séquence d'animation (sans scroll pour éviter les boucles sur mobile)
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

  // Récupérer les emojis des familles pour le dos
  const familyEmojis = families.map(f => f.emoji).join(' ');

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
            >
              <div className="pile-card-content">
                <div className="pile-card-title">LES FAMILLES</div>
                <div className="pile-card-emojis">{familyEmojis || '🎴'}</div>
                <div className="pile-card-title-bottom">LES FAMILLES</div>
              </div>
            </div>
          ))}
        </div>

        {/* Carte qui sort du paquet */}
        <div className={`drawn-card ${phase}`}>
          <div className="card-inner">
            <div className="card-back">
              <div className="card-back-content">
                <div className="card-back-title">LES FAMILLES</div>
                <div className="card-back-emojis">{familyEmojis || '🎴'}</div>
                <div className="card-back-title-bottom">LES FAMILLES</div>
              </div>
            </div>
            <div className="card-front">
              <div className="card-front-family-emoji">{drawnCard.familyEmoji}</div>
              <div className="card-front-emoji">{drawnCard.memberEmoji}</div>
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
