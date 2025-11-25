import { useState, useEffect } from 'react';
import { socket, connectSocket } from './socket';
import HomeScreen from './components/HomeScreen';
import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';
import GameOver from './components/GameOver';
import PreparingGame from './components/PreparingGame';
import './App.css';

function App() {
  const [screen, setScreen] = useState('home'); // home, lobby, preparing, game, gameover
  const [playerName, setPlayerName] = useState('');
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [preparingStatus, setPreparingStatus] = useState(null);

  useEffect(() => {
    connectSocket();

    socket.on('connect', () => {
      console.log('Connecté au serveur');
    });

    socket.on('disconnect', () => {
      console.log('Déconnecté du serveur');
    });

    socket.on('playerJoined', (data) => {
      setGameState(prev => prev ? { ...prev, players: data.players } : null);
    });

    socket.on('playerLeft', (data) => {
      setGameState(prev => prev ? { ...prev, players: data.players } : null);
    });

    socket.on('playerReady', (data) => {
      setGameState(prev => prev ? { ...prev, players: data.players } : null);
    });

    // Nouveaux événements pour la génération d'images
    socket.on('preparingGame', (data) => {
      setScreen('preparing');
      setPreparingStatus({
        message: data.message,
        current: 0,
        total: data.familiesCount
      });
    });

    socket.on('generatingImages', (data) => {
      setPreparingStatus({
        message: data.message,
        familyName: data.familyName,
        current: data.current,
        total: data.total
      });
    });

    socket.on('addingNewFamilies', (data) => {
      setPreparingStatus({
        message: data.message,
        isAddingNew: true,
        count: data.count
      });
    });

    socket.on('gameStarted', (state) => {
      setGameState(state);
      setPreparingStatus(null);
      setScreen('game');
    });

    socket.on('gameUpdate', (state) => {
      setGameState(state);
      if (state.status === 'finished') {
        setScreen('gameover');
      }
    });

    socket.on('playerDisconnected', (data) => {
      setGameState(prev => prev ? { ...prev, players: data.players } : null);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('playerJoined');
      socket.off('playerLeft');
      socket.off('playerReady');
      socket.off('preparingGame');
      socket.off('generatingImages');
      socket.off('addingNewFamilies');
      socket.off('gameStarted');
      socket.off('gameUpdate');
      socket.off('playerDisconnected');
    };
  }, []);

  const handleCreateGame = (name) => {
    setPlayerName(name);
    socket.emit('createGame', name, (response) => {
      if (response.success) {
        setGameState(response.game);
        setIsHost(true);
        setScreen('lobby');
        setError('');
      } else {
        setError(response.error);
      }
    });
  };

  const handleJoinGame = (name, code) => {
    setPlayerName(name);
    socket.emit('joinGame', { playerName: name, gameCode: code }, (response) => {
      if (response.success) {
        setGameState(response.game);
        setIsHost(false);
        setScreen('lobby');
        setError('');
      } else {
        setError(response.error);
      }
    });
  };

  const handleStartGame = () => {
    socket.emit('startGame', (response) => {
      if (!response.success) {
        setError(response.error);
      }
    });
  };

  const handleSetReady = (ready) => {
    socket.emit('setReady', ready);
  };

  const handleAskCard = (targetPlayerId, familyId, memberId, callback) => {
    socket.emit('askCard', { targetPlayerId, familyId, memberId }, callback);
  };

  const handlePlayAgain = () => {
    setScreen('home');
    setGameState(null);
    setIsHost(false);
  };

  return (
    <div className="app">
      {screen === 'home' && (
        <HomeScreen
          onCreateGame={handleCreateGame}
          onJoinGame={handleJoinGame}
          error={error}
          setError={setError}
        />
      )}

      {screen === 'lobby' && gameState && (
        <Lobby
          gameState={gameState}
          playerName={playerName}
          isHost={isHost}
          onStartGame={handleStartGame}
          onSetReady={handleSetReady}
          error={error}
        />
      )}

      {screen === 'preparing' && (
        <PreparingGame status={preparingStatus} />
      )}

      {screen === 'game' && gameState && (
        <GameBoard
          gameState={gameState}
          playerName={playerName}
          onAskCard={handleAskCard}
        />
      )}

      {screen === 'gameover' && gameState && (
        <GameOver
          gameState={gameState}
          playerName={playerName}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}

export default App;
