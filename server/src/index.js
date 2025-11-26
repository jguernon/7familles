import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  generateGameCode,
  shuffleDeck,
  hasCardFromFamily,
  hasCard,
  removeCard,
  checkCompletedFamily,
  extractCompletedFamily,
  MEMBERS
} from './game.js';
import {
  selectRandomFamilies,
  createSimpleDeck,
  getAllFamilies
} from './familyStorage.js';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Stockage des parties en mémoire
const games = new Map();

// Génère un code unique qui n'existe pas déjà
function getUniqueGameCode() {
  let code;
  do {
    code = generateGameCode();
  } while (games.has(code));
  return code;
}

// Crée une nouvelle partie
function createGame(hostSocketId, hostName) {
  const code = getUniqueGameCode();
  const game = {
    code,
    host: hostSocketId,
    players: [{
      id: hostSocketId,
      name: hostName,
      ready: false
    }],
    status: 'waiting', // waiting, playing, finished
    currentPlayerIndex: 0,
    hands: {},
    drawPile: [],
    completedFamilies: {},
    firstFamilyCompleted: null, // Pour départager les égalités
    lastAction: null,
    createdAt: Date.now(),
    // Nouvelles propriétés pour familles dynamiques
    families: [], // Familles en jeu
    totalFamiliesInGame: 0, // Nombre total de familles dans la partie
    familiesCompleted: 0, // Nombre de familles complétées
    pendingNewFamilies: false // Flag pour éviter les ajouts multiples
  };
  games.set(code, game);
  return game;
}

// Démarre une partie
async function startGame(game) {
  // Sélectionne 7 familles aléatoires
  const initialFamilyCount = config.game.initialFamilies;
  const selectedFamilies = await selectRandomFamilies(initialFamilyCount);

  game.families = selectedFamilies;
  game.totalFamiliesInGame = selectedFamilies.length;

  // Crée le deck avec ces familles
  const deck = createSimpleDeck(selectedFamilies);
  const shuffled = shuffleDeck(deck);

  const cardsPerPlayer = config.game.cardsPerPlayer;

  // Distribue les cartes aux joueurs
  game.players.forEach((player, index) => {
    game.hands[player.id] = shuffled.slice(index * cardsPerPlayer, (index + 1) * cardsPerPlayer);
    game.completedFamilies[player.id] = [];
  });

  // Le reste va dans la pioche
  game.drawPile = shuffled.slice(game.players.length * cardsPerPlayer);
  game.status = 'playing';
  game.currentPlayerIndex = 0; // Le premier joueur commence

  console.log(`Partie démarrée avec ${selectedFamilies.length} familles: ${selectedFamilies.map(f => f.name).join(', ')}`);
}

// Obtient l'état du jeu pour un joueur spécifique (cache les mains des autres)
function getGameStateForPlayer(game, playerId) {
  const playerHand = game.hands[playerId] || [];

  // Compte les cartes des autres joueurs sans révéler leur contenu
  const otherPlayersCardCount = {};
  game.players.forEach(player => {
    if (player.id !== playerId) {
      otherPlayersCardCount[player.id] = (game.hands[player.id] || []).length;
    }
  });

  return {
    code: game.code,
    status: game.status,
    players: game.players,
    currentPlayerIndex: game.currentPlayerIndex,
    currentPlayerId: game.players[game.currentPlayerIndex]?.id,
    myHand: playerHand,
    otherPlayersCardCount,
    drawPileCount: game.drawPile.length,
    completedFamilies: game.completedFamilies,
    lastAction: game.lastAction,
    families: game.families, // Familles dynamiques de la partie
    members: MEMBERS,
    isMyTurn: game.players[game.currentPlayerIndex]?.id === playerId,
    totalFamiliesInGame: game.totalFamiliesInGame
  };
}

// Socket.IO events
io.on('connection', (socket) => {
  console.log(`Joueur connecté: ${socket.id}`);

  // Créer une nouvelle partie
  socket.on('createGame', (playerName, callback) => {
    const game = createGame(socket.id, playerName);
    socket.join(game.code);
    console.log(`Partie créée: ${game.code} par ${playerName}`);
    callback({ success: true, gameCode: game.code, game: getGameStateForPlayer(game, socket.id) });
  });

  // Rejoindre une partie
  socket.on('joinGame', (data, callback) => {
    const { gameCode, playerName } = data;
    const game = games.get(gameCode.toUpperCase());

    if (!game) {
      callback({ success: false, error: 'Partie introuvable' });
      return;
    }

    if (game.status !== 'waiting') {
      callback({ success: false, error: 'La partie a déjà commencé' });
      return;
    }

    if (game.players.length >= 6) {
      callback({ success: false, error: 'La partie est complète (6 joueurs max)' });
      return;
    }

    if (game.players.some(p => p.name === playerName)) {
      callback({ success: false, error: 'Ce nom est déjà utilisé' });
      return;
    }

    game.players.push({
      id: socket.id,
      name: playerName,
      ready: false
    });

    socket.join(game.code);
    console.log(`${playerName} a rejoint la partie ${game.code}`);

    // Notifie tous les joueurs
    io.to(game.code).emit('playerJoined', {
      players: game.players,
      newPlayer: playerName
    });

    callback({ success: true, game: getGameStateForPlayer(game, socket.id) });
  });

  // Marquer prêt
  socket.on('setReady', (ready) => {
    const game = findGameByPlayerId(socket.id);
    if (!game) return;

    const player = game.players.find(p => p.id === socket.id);
    if (player) {
      player.ready = ready;
      io.to(game.code).emit('playerReady', { playerId: socket.id, ready, players: game.players });
    }
  });

  // Démarrer la partie (hôte seulement)
  socket.on('startGame', async (callback) => {
    const game = findGameByPlayerId(socket.id);
    if (!game) {
      callback({ success: false, error: 'Partie introuvable' });
      return;
    }

    if (game.host !== socket.id) {
      callback({ success: false, error: 'Seul l\'hôte peut démarrer la partie' });
      return;
    }

    if (game.players.length < 2) {
      callback({ success: false, error: 'Il faut au moins 2 joueurs' });
      return;
    }

    await startGame(game);
    console.log(`Partie ${game.code} démarrée avec ${game.players.length} joueurs`);

    // Envoie l'état à chaque joueur
    game.players.forEach(player => {
      io.to(player.id).emit('gameStarted', getGameStateForPlayer(game, player.id));
    });

    callback({ success: true });
  });

  // Demander une carte
  socket.on('askCard', async (data, callback) => {
    const { targetPlayerId, familyId, memberId } = data;
    const game = findGameByPlayerId(socket.id);

    if (!game || game.status !== 'playing') {
      callback({ success: false, error: 'Partie non en cours' });
      return;
    }

    if (game.players[game.currentPlayerIndex].id !== socket.id) {
      callback({ success: false, error: 'Ce n\'est pas votre tour' });
      return;
    }

    const askerHand = game.hands[socket.id];
    const targetHand = game.hands[targetPlayerId];

    if (!askerHand || !targetHand) {
      callback({ success: false, error: 'Joueur introuvable' });
      return;
    }

    // Vérifie que le demandeur possède au moins une carte de cette famille
    if (!hasCardFromFamily(askerHand, familyId)) {
      callback({ success: false, error: 'Vous devez posséder au moins une carte de cette famille' });
      return;
    }

    const askerName = game.players.find(p => p.id === socket.id).name;
    const targetName = game.players.find(p => p.id === targetPlayerId).name;
    const family = game.families.find(f => f.id === familyId);
    const member = MEMBERS.find(m => m.id === memberId);

    if (hasCard(targetHand, familyId, memberId)) {
      // Le joueur cible a la carte
      const card = removeCard(targetHand, familyId, memberId);
      askerHand.push(card);

      game.lastAction = {
        type: 'success',
        asker: askerName,
        askerId: socket.id,
        target: targetName,
        targetId: targetPlayerId,
        family: family.name,
        member: member.name,
        card: card, // La carte volée pour l'animation
        timestamp: Date.now()
      };

      // Vérifie si une famille est complétée
      if (checkCompletedFamily(askerHand, familyId)) {
        const completedCards = extractCompletedFamily(askerHand, familyId);
        game.completedFamilies[socket.id].push({
          familyId,
          familyName: family.name,
          cards: completedCards
        });

        // Enregistre qui a complété la première famille
        if (!game.firstFamilyCompleted) {
          game.firstFamilyCompleted = socket.id;
        }

        game.lastAction.familyCompleted = family.name;
      }

      // Le joueur rejoue - inclure la carte pour l'animation
      callback({ success: true, gotCard: true, stolenCard: card, fromPlayerId: targetPlayerId });

    } else {
      // Le joueur cible n'a pas la carte, on pioche
      game.lastAction = {
        type: 'fail',
        asker: askerName,
        target: targetName,
        family: family.name,
        member: member.name,
        timestamp: Date.now()
      };

      if (game.drawPile.length > 0) {
        const drawnCard = game.drawPile.pop();
        askerHand.push(drawnCard);

        if (drawnCard.familyId === familyId && drawnCard.memberId === memberId) {
          // Carte piochée est celle demandée!
          game.lastAction.drewRequestedCard = true;

          // Vérifie si une famille est complétée
          if (checkCompletedFamily(askerHand, familyId)) {
            const completedCards = extractCompletedFamily(askerHand, familyId);
            game.completedFamilies[socket.id].push({
              familyId,
              familyName: family.name,
              cards: completedCards
            });

            if (!game.firstFamilyCompleted) {
              game.firstFamilyCompleted = socket.id;
            }

            game.lastAction.familyCompleted = family.name;
          }

          callback({ success: true, gotCard: true, drewRequestedCard: true, drawnCard });
        } else {
          // Passe au joueur suivant
          game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
          callback({ success: true, gotCard: false, drawnCard });
        }
      } else {
        // Pioche vide, passe au suivant
        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
        callback({ success: true, gotCard: false, emptyDeck: true, drawnCard: null });
      }
    }

    // Compte les familles complétées
    const totalCompleted = Object.values(game.completedFamilies).reduce((sum, families) => sum + families.length, 0);
    game.familiesCompleted = totalCompleted;

    // Vérifie si la partie est terminée (pioche vide ET plus personne ne peut jouer)
    const allHandsEmpty = Object.values(game.hands).every(hand => hand.length === 0);
    if (game.drawPile.length === 0 && allHandsEmpty) {
      game.status = 'finished';
      game.lastAction.gameOver = true;
    }

    // Met à jour tous les joueurs
    game.players.forEach(player => {
      io.to(player.id).emit('gameUpdate', getGameStateForPlayer(game, player.id));
    });
  });

  // Déconnexion
  socket.on('disconnect', () => {
    console.log(`Joueur déconnecté: ${socket.id}`);
    const game = findGameByPlayerId(socket.id);

    if (game) {
      const playerIndex = game.players.findIndex(p => p.id === socket.id);
      const playerName = game.players[playerIndex]?.name;

      if (game.status === 'waiting') {
        // En attente, on retire simplement le joueur
        game.players.splice(playerIndex, 1);

        if (game.players.length === 0) {
          games.delete(game.code);
          console.log(`Partie ${game.code} supprimée (vide)`);
        } else {
          // Si l'hôte part, le premier joueur devient hôte
          if (game.host === socket.id) {
            game.host = game.players[0].id;
          }
          io.to(game.code).emit('playerLeft', {
            playerName,
            players: game.players,
            newHost: game.host
          });
        }
      } else if (game.status === 'playing') {
        // En jeu, on marque le joueur comme déconnecté
        const player = game.players[playerIndex];
        if (player) {
          player.disconnected = true;

          // Si c'était son tour, passe au suivant
          if (game.currentPlayerIndex === playerIndex) {
            game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
          }

          io.to(game.code).emit('playerDisconnected', {
            playerName,
            players: game.players
          });

          // Met à jour l'état
          game.players.forEach(p => {
            if (!p.disconnected) {
              io.to(p.id).emit('gameUpdate', getGameStateForPlayer(game, p.id));
            }
          });
        }
      }
    }
  });
});

// Trouve une partie par l'ID d'un joueur
function findGameByPlayerId(playerId) {
  for (const game of games.values()) {
    if (game.players.some(p => p.id === playerId)) {
      return game;
    }
  }
  return null;
}

// Route de santé
app.get('/health', (req, res) => {
  res.json({ status: 'ok', games: games.size });
});

// Route pour obtenir toutes les familles disponibles
app.get('/api/families', async (req, res) => {
  try {
    const families = await getAllFamilies();
    res.json({ success: true, families });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// En production, servir les fichiers statiques du client React
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDistPath));

  // Toutes les routes non-API renvoient vers index.html (SPA)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/images') && !req.path.startsWith('/socket.io')) {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    }
  });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎴 Serveur des 7 Familles démarré sur le port ${PORT}`);
});
