import './PreparingGame.css';

function PreparingGame({ status }) {
  const progress = status?.total ? (status.current / status.total) * 100 : 0;

  return (
    <div className="preparing-game">
      <div className="preparing-container fade-in">
        <div className="preparing-icon">
          <span className="card-icon">🎴</span>
        </div>

        <h1>Préparation de la partie</h1>

        <div className="preparing-message">
          {status?.message || 'Chargement...'}
        </div>

        {status?.familyName && (
          <div className="preparing-family">
            Famille: <strong>{status.familyName}</strong>
          </div>
        )}

        {status?.total > 0 && (
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="progress-text">
              {status.current} / {status.total} familles
            </div>
          </div>
        )}

        <div className="preparing-hint">
          Les images sont générées par IA pour tous les joueurs...
        </div>

        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
}

export default PreparingGame;
