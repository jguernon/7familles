import { useState, useEffect, useMemo } from 'react';
import './CardLostAnimation.css';

// Générer les emojis de pouf
function generatePoufEmojis() {
  const emojis = [];
  const emojiTypes = ['💨', '💨', '💨', '☁️', '☁️', '✨', '💫'];
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * 360;
    const distance = 50 + Math.random() * 40;
    emojis.push({
      id: i,
      emoji: emojiTypes[Math.floor(Math.random() * emojiTypes.length)],
      angle,
      distance,
      delay: Math.random() * 0.15,
      scale: 0.6 + Math.random() * 0.6,
    });
  }
  return emojis;
}

function CardLostAnimation({ card, onComplete }) {
  const [phase, setPhase] = useState('active');
  const poufEmojis = useMemo(() => generatePoufEmojis(), []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!card || phase === 'done') return null;

  return (
    <div className="card-lost-overlay">
      <div className="card-lost-container">
        {/* Carte qui disparaît */}
        <div className="lost-card shrinking">
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

        {/* Emojis de pouf qui explosent */}
        <div className="pouf-emojis">
          {poufEmojis.map((item) => (
            <div
              key={item.id}
              className="pouf-emoji"
              style={{
                '--angle': `${item.angle}deg`,
                '--distance': `${item.distance}px`,
                '--delay': `${item.delay}s`,
                '--scale': item.scale,
              }}
            >
              {item.emoji}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CardLostAnimation;
