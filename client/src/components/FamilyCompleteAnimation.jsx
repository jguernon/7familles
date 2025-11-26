import { useMemo, useEffect } from 'react';
import './FamilyCompleteAnimation.css';

function generateStars() {
  const stars = [];
  const emojis = ['⭐', '🌟', '✨', '💫'];
  for (let i = 0; i < 20; i++) {
    stars.push({
      id: i,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      angle: (i / 20) * 360,
      distance: 60 + Math.random() * 80,
      delay: Math.random() * 0.3,
      duration: 0.8 + Math.random() * 0.4,
      scale: 0.8 + Math.random() * 0.6,
    });
  }
  return stars;
}

function FamilyCompleteAnimation({ familyEmoji, familyName, familyColor, onComplete }) {
  const stars = useMemo(() => generateStars(), []);

  // Fermer après 2.5 secondes
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="family-complete-overlay">
      <div className="family-complete-content">
        {/* Étoiles qui explosent */}
        <div className="stars-container">
          {stars.map((star) => (
            <div
              key={star.id}
              className="star-emoji"
              style={{
                '--angle': `${star.angle}deg`,
                '--distance': `${star.distance}px`,
                '--delay': `${star.delay}s`,
                '--duration': `${star.duration}s`,
                '--scale': star.scale,
              }}
            >
              {star.emoji}
            </div>
          ))}
        </div>

        {/* Emoji de la famille au centre */}
        <div className="family-emoji-center" style={{ '--family-color': familyColor }}>
          {familyEmoji}
        </div>

        {/* Texte */}
        <div className="family-complete-text">
          <span className="complete-label">Famille complète!</span>
          <span className="family-name-badge" style={{ background: familyColor }}>
            {familyName}
          </span>
        </div>
      </div>
    </div>
  );
}

export default FamilyCompleteAnimation;
