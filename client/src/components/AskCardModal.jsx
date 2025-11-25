import { useState } from 'react';
import './AskCardModal.css';

function AskCardModal({ selectedFamily, players, members, myHand, onAsk, onClose }) {
  const [step, setStep] = useState(1); // 1: choisir joueur, 2: choisir membre
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  // Trouve les membres que je possède déjà de cette famille
  const myMembersOfFamily = myHand
    .filter(card => card.familyId === selectedFamily.familyId)
    .map(card => card.memberId);

  // Membres que je peux demander (ceux que je n'ai pas)
  const availableMembers = members.filter(m => !myMembersOfFamily.includes(m.id));

  const handleSelectPlayer = (player) => {
    setSelectedPlayer(player);
    setStep(2);
  };

  const handleSelectMember = (member) => {
    setSelectedMember(member);
  };

  const handleConfirm = () => {
    if (selectedPlayer && selectedMember) {
      onAsk(selectedPlayer.id, selectedMember.id);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedMember(null);
    } else {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>

        <div className="modal-header">
          <div
            className="selected-family"
            style={{ background: selectedFamily.familyColor }}
          >
            Famille {selectedFamily.familyName}
          </div>
        </div>

        {step === 1 && (
          <div className="modal-step fade-in">
            <h3>A qui demander?</h3>
            <div className="player-choices">
              {players.map(player => (
                <button
                  key={player.id}
                  className="player-choice"
                  onClick={() => handleSelectPlayer(player)}
                >
                  <span className="player-choice-avatar">
                    {player.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="player-choice-name">{player.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="modal-step fade-in">
            <h3>Quel membre demander à {selectedPlayer.name}?</h3>
            <p className="modal-hint">
              Dans la famille {selectedFamily.familyName}, je voudrais...
            </p>
            <div className="member-choices">
              {availableMembers.map(member => (
                <button
                  key={member.id}
                  className={`member-choice ${selectedMember?.id === member.id ? 'selected' : ''}`}
                  onClick={() => handleSelectMember(member)}
                >
                  <span className="member-emoji">{member.emoji}</span>
                  <span className="member-name">{member.name}</span>
                </button>
              ))}
            </div>

            {availableMembers.length === 0 && (
              <p className="no-members">Vous avez déjà tous les membres de cette famille!</p>
            )}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={handleBack}>
            {step === 1 ? 'Annuler' : 'Retour'}
          </button>
          {step === 2 && selectedMember && (
            <button className="btn btn-primary" onClick={handleConfirm}>
              Demander
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AskCardModal;
