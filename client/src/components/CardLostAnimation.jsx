import { useState, useEffect, useRef, useCallback } from 'react';
import './CardLostAnimation.css';

function CardLostAnimation({ card, onComplete }) {
  const [phase, setPhase] = useState('entering'); // entering, grabbing, leaving
  const hasStartedRef = useRef(false);
  const stableOnComplete = useCallback(onComplete, []);

  useEffect(() => {
    // Éviter de relancer l'animation si elle a déjà commencé
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    // Séquence d'animation
    const timers = [
      setTimeout(() => setPhase('grabbing'), 400),
      setTimeout(() => setPhase('leaving'), 800),
      setTimeout(() => {
        stableOnComplete();
      }, 1400)
    ];

    return () => timers.forEach(t => clearTimeout(t));
  }, [stableOnComplete]);

  if (!card) return null;

  return (
    <div className="card-lost-overlay">
      <div className="card-lost-container">
        {/* Main géante qui vient chercher la carte */}
        <div className={`grabbing-hand ${phase}`}>
          <span className="hand-emoji">🤚</span>
        </div>

        {/* Carte qui se fait attraper */}
        <div className={`lost-card ${phase}`}>
          <div className="lost-card-content">
            <div className="lost-family-emoji">{card.familyEmoji}</div>
            <div className="lost-member-emoji">{card.memberEmoji}</div>
          </div>
          <div className="lost-card-info">
            <span className="lost-member-name">{card.memberName}</span>
            <span
              className="lost-family-name"
              style={{ background: card.familyColor }}
            >
              {card.familyName}
            </span>
          </div>
        </div>

        {/* Petits effets quand la main attrape */}
        {phase === 'grabbing' && (
          <div className="grab-effects">
            <span className="grab-star">✨</span>
            <span className="grab-star delayed">💫</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default CardLostAnimation;
