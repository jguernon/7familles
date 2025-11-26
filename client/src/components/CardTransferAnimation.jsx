import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import './CardTransferAnimation.css';

// Générer les nuages d'explosion
function generateClouds() {
  const clouds = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * 360;
    const distance = 40 + Math.random() * 30;
    clouds.push({
      id: i,
      emoji: '💨',
      angle,
      distance,
      delay: Math.random() * 0.2,
      scale: 0.8 + Math.random() * 0.4,
    });
  }
  return clouds;
}

function CardTransferAnimation({ transfer, onComplete }) {
  const [phase, setPhase] = useState('idle');
  const [positions, setPositions] = useState({ start: null, end: null });
  const cardRef = useRef(null);
  const clouds = useMemo(() => generateClouds(), []);
  const hasStartedRef = useRef(false);

  // Stabiliser onComplete pour éviter les re-triggers
  const stableOnComplete = useCallback(onComplete, []);

  // Calculer les positions et démarrer l'animation
  useEffect(() => {
    if (!transfer || hasStartedRef.current) return;
    hasStartedRef.current = true;

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

      // Démarrer l'animation avec les nuages
      setPhase('exploding');

      const timers = [
        setTimeout(() => setPhase('lifting'), 500),
        setTimeout(() => setPhase('flying'), 1000),
        setTimeout(() => setPhase('landing'), 1700),
        setTimeout(() => {
          setPhase('done');
          stableOnComplete();
        }, 2300)
      ];

      return () => timers.forEach(t => clearTimeout(t));
    } else {
      // Si on ne trouve pas les éléments, terminer immédiatement
      stableOnComplete();
    }
  }, [transfer, stableOnComplete]);

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
      {/* Nuages d'explosion à la position de départ */}
      {(phase === 'exploding' || phase === 'lifting') && (
        <div
          className="explosion-clouds"
          style={{
            left: positions.start.x,
            top: positions.start.y,
          }}
        >
          {clouds.map((cloud) => (
            <div
              key={cloud.id}
              className="cloud-emoji"
              style={{
                '--angle': `${cloud.angle}deg`,
                '--distance': `${cloud.distance}px`,
                '--delay': `${cloud.delay}s`,
                '--scale': cloud.scale,
              }}
            >
              {cloud.emoji}
            </div>
          ))}
        </div>
      )}

      <div
        ref={cardRef}
        className={`transfer-card ${phase}`}
        style={getCardStyle()}
      >
        <div className="transfer-card-content">
          <div className="transfer-family-emoji">{transfer.card?.familyEmoji}</div>
          <div className="transfer-member-emoji">{transfer.card?.memberEmoji}</div>
        </div>
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
