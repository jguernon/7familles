import { useState } from 'react';
import './AskCardModal.css';

function AskCardModal({ selectedFamily, allFamilies, players, members, myHand, onAsk, onClose }) {
  // Si selectedFamily est null, on doit d'abord choisir une famille
  const [step, setStep] = useState(selectedFamily ? 1 : 0); // 0: choisir famille, 1: choisir joueur, 2: choisir membre
  const [currentFamily, setCurrentFamily] = useState(selectedFamily);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  // IDs des familles que je possède déjà
  const myFamilyIds = [...new Set(myHand.map(card => card.familyId))];

  // Familles que je peux demander (toutes celles du jeu que je n'ai pas complètement)
  // On exclut les familles dont j'ai déjà les 6 membres
  const availableFamilies = allFamilies?.filter(family => {
    const myCardsOfFamily = myHand.filter(card => card.familyId === family.id);
    return myCardsOfFamily.length < 6; // Moins de 6 = pas complète
  }) || [];

  // Trouve les membres que je possède déjà de la famille sélectionnée
  const myMembersOfFamily = currentFamily
    ? myHand
        .filter(card => card.familyId === currentFamily.familyId)
        .map(card => card.memberId)
    : [];

  // Membres que je peux demander (ceux que je n'ai pas)
  const availableMembers = members.filter(m => !myMembersOfFamily.includes(m.id));

  const handleSelectFamily = (family) => {
    setCurrentFamily({
      familyId: family.id,
      familyName: family.name,
      familyColor: family.color,
      familyEmoji: family.emoji
    });
    setStep(1);
  };

  const handleSelectPlayer = (player) => {
    setSelectedPlayer(player);
    setStep(2);
  };

  const handleSelectMember = (member) => {
    setSelectedMember(member);
  };

  const handleConfirm = () => {
    if (selectedPlayer && selectedMember && currentFamily) {
      onAsk(selectedPlayer.id, selectedMember.id, currentFamily.familyId);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedMember(null);
    } else if (step === 1 && !selectedFamily) {
      setStep(0);
      setCurrentFamily(null);
      setSelectedPlayer(null);
    } else {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>

        {/* Étape 0: Choisir une famille */}
        {step === 0 && (
          <div className="modal-step fade-in">
            <div className="modal-header">
              <h3>Quelle famille demander?</h3>
            </div>
            <div className="family-choices">
              {availableFamilies.map(family => {
                const myCardsCount = myHand.filter(c => c.familyId === family.id).length;
                const isOwned = myCardsCount > 0;
                return (
                  <button
                    key={family.id}
                    className={`family-choice ${isOwned ? 'owned' : ''}`}
                    style={{ '--family-color': family.color }}
                    onClick={() => handleSelectFamily(family)}
                  >
                    <span className="family-choice-emoji">{family.emoji}</span>
                    <span className="family-choice-name">{family.name}</span>
                    {myCardsCount > 0 && (
                      <span className="family-choice-count">{myCardsCount}/6</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Étape 1: Choisir un joueur */}
        {step === 1 && currentFamily && (
          <div className="modal-step fade-in">
            <div className="modal-header">
              <div
                className="selected-family"
                style={{ background: currentFamily.familyColor }}
              >
                {currentFamily.familyEmoji && (
                  <span className="selected-family-emoji">{currentFamily.familyEmoji}</span>
                )}
                Famille {currentFamily.familyName}
              </div>
            </div>
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

        {/* Étape 2: Choisir un membre */}
        {step === 2 && currentFamily && (
          <div className="modal-step fade-in">
            <div className="modal-header">
              <div
                className="selected-family"
                style={{ background: currentFamily.familyColor }}
              >
                {currentFamily.familyEmoji && (
                  <span className="selected-family-emoji">{currentFamily.familyEmoji}</span>
                )}
                Famille {currentFamily.familyName}
              </div>
            </div>
            <h3>Quel membre demander à {selectedPlayer.name}?</h3>
            <p className="modal-hint">
              Dans la famille {currentFamily.familyName}, je voudrais...
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
            {step === 0 ? 'Annuler' : 'Retour'}
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
