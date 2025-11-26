import { useMemo } from 'react';
import './FloatingEmojis.css';

// Emojis des familles
const FAMILY_EMOJIS = ['🥖', '🚀', '🎩', '🏴‍☠️', '⚙️', '🧭', '🎵', '🩺', '🚒', '🚔', '🌾', '🎣', '👨‍🍳', '🌻'];

function FloatingEmojis() {
  // Génère des emojis avec positions et animations aléatoires
  const emojis = useMemo(() => {
    const items = [];
    const count = 30; // Nombre d'emojis flottants

    for (let i = 0; i < count; i++) {
      items.push({
        id: i,
        emoji: FAMILY_EMOJIS[i % FAMILY_EMOJIS.length],
        left: Math.random() * 100,
        animationDuration: 15 + Math.random() * 20, // 15-35s
        animationDelay: Math.random() * -30, // Départ décalé
        size: 20 + Math.random() * 30, // 20-50px
        opacity: 0.1 + Math.random() * 0.2, // 0.1-0.3
      });
    }

    return items;
  }, []);

  return (
    <div className="floating-emojis-container">
      {emojis.map((item) => (
        <div
          key={item.id}
          className="floating-emoji"
          style={{
            left: `${item.left}%`,
            fontSize: `${item.size}px`,
            opacity: item.opacity,
            animationDuration: `${item.animationDuration}s`,
            animationDelay: `${item.animationDelay}s`,
          }}
        >
          {item.emoji}
        </div>
      ))}
    </div>
  );
}

export default FloatingEmojis;
