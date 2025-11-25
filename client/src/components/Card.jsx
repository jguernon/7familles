import { useState, useEffect } from 'react';
import './Card.css';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

function Card({ card, onClick, disabled, small, highlighted }) {
  const [imageUrl, setImageUrl] = useState(card.image);
  const [imageError, setImageError] = useState(false);

  // Charger l'image depuis le serveur si pas d'image embarquée
  useEffect(() => {
    if (!card.image && !imageError) {
      // Utiliser l'API qui génère les images à la demande
      const serverImageUrl = `${SERVER_URL}/api/card-image/${card.id}`;

      // Vérifier si l'image existe
      const img = new Image();
      img.onload = () => {
        setImageUrl(serverImageUrl);
      };
      img.onerror = () => {
        // Image n'existe pas, on reste sur l'emoji
        setImageUrl(null);
      };
      img.src = serverImageUrl;
    }
  }, [card.id, card.image, imageError]);

  const hasImage = imageUrl && !imageError;

  return (
    <div
      className={`card ${disabled ? 'disabled' : ''} ${small ? 'small' : ''} ${hasImage ? 'has-image' : ''} ${highlighted ? 'highlighted' : ''}`}
      onClick={disabled ? undefined : onClick}
      style={{ '--card-color': card.familyColor }}
    >
      {hasImage ? (
        <div className="card-image-container">
          <img
            src={imageUrl}
            alt={`${card.memberName} - ${card.familyName}`}
            className="card-image"
            onError={() => setImageError(true)}
          />
          <div className="card-overlay">
            <span className="card-member-small">{card.memberName}</span>
          </div>
        </div>
      ) : (
        <>
          <div className="card-emoji">{card.memberEmoji}</div>
          <div className="card-member">{card.memberName}</div>
        </>
      )}
      {!small && <div className="card-family">{card.memberName}</div>}
    </div>
  );
}

export default Card;
