import { useState, useEffect } from 'react';
import './HomeScreen.css';

function HomeScreen({ onCreateGame, onJoinGame, error, setError }) {
  const [mode, setMode] = useState(null); // null, 'create', 'join'
  const [name, setName] = useState('');
  const [gameCode, setGameCode] = useState('');

  // Lire le code de partie depuis l'URL au chargement
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = params.get('code');
    if (codeFromUrl) {
      setGameCode(codeFromUrl.toUpperCase());
      setMode('join');
      // Nettoyer l'URL sans recharger la page
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Veuillez entrer votre nom');
      return;
    }

    if (name.trim().length < 2) {
      setError('Le nom doit contenir au moins 2 caractères');
      return;
    }

    if (mode === 'create') {
      onCreateGame(name.trim());
    } else if (mode === 'join') {
      if (!gameCode.trim()) {
        setError('Veuillez entrer le code de la partie');
        return;
      }
      onJoinGame(name.trim(), gameCode.trim().toUpperCase());
    }
  };

  const handleBack = () => {
    setMode(null);
    setError('');
  };

  return (
    <div className="home-screen">
      <div className="home-container fade-in">
        <div className="logo">
          <span className="logo-number">Les</span>
          <span className="logo-text">Familles</span>
        </div>

        {!mode && (
          <div className="home-buttons">
            <button
              className="btn btn-primary"
              onClick={() => setMode('create')}
            >
              Nouvelle Partie
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setMode('join')}
            >
              Rejoindre une Partie
            </button>
          </div>
        )}

        {mode && (
          <form className="home-form slide-in" onSubmit={handleSubmit}>
            <button
              type="button"
              className="btn-back"
              onClick={handleBack}
            >
              ← Retour
            </button>

            <h2>{mode === 'create' ? 'Nouvelle Partie' : 'Rejoindre une Partie'}</h2>

            <div className="form-group">
              <label htmlFor="name">Votre nom</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Entrez votre nom"
                maxLength={20}
                autoComplete="off"
              />
            </div>

            {mode === 'join' && (
              <div className="form-group">
                <label htmlFor="code">Code de la partie</label>
                <input
                  type="text"
                  id="code"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  placeholder="Ex: ABC123"
                  maxLength={6}
                  autoComplete="off"
                  className="code-input"
                />
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn btn-primary btn-submit">
              {mode === 'create' ? 'Créer la partie' : 'Rejoindre'}
            </button>
          </form>
        )}

        <div className="home-footer">
          <p>2-6 joueurs • Jeu de cartes classique</p>
        </div>
      </div>
    </div>
  );
}

export default HomeScreen;
