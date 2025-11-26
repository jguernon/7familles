import './Card.css';

function Card({ card, onClick, disabled, small, highlighted }) {
  return (
    <div
      className={`card ${disabled ? 'disabled' : ''} ${small ? 'small' : ''} ${highlighted ? 'highlighted' : ''}`}
      onClick={disabled ? undefined : onClick}
      style={{ '--card-color': card.familyColor }}
    >
      <div className="card-family-emoji">{card.familyEmoji}</div>
      <div className="card-member-emoji">{card.memberEmoji}</div>
      <div className="card-member">{card.memberName}</div>
      {!small && <div className="card-family">{card.familyName}</div>}
    </div>
  );
}

export default Card;
