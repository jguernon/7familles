// Logique du jeu des 7 familles avec familles dynamiques
import { config } from './config.js';

// Les 6 membres de chaque famille
const MEMBERS = [
  { id: 'grandpere', name: 'Grand-père', emoji: '👴' },
  { id: 'grandmere', name: 'Grand-mère', emoji: '👵' },
  { id: 'pere', name: 'Père', emoji: '👨' },
  { id: 'mere', name: 'Mère', emoji: '👩' },
  { id: 'fils', name: 'Fils', emoji: '👦' },
  { id: 'fille', name: 'Fille', emoji: '👧' }
];

// Génère un code de partie unique (6 caractères alphanumériques)
export function generateGameCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Crée un deck à partir d'une liste de familles
export function createDeck(families) {
  const deck = [];
  for (const family of families) {
    for (const member of MEMBERS) {
      deck.push({
        id: `${family.id}-${member.id}`,
        familyId: family.id,
        familyName: family.name,
        familyColor: family.color,
        familyTheme: family.theme || '',
        memberId: member.id,
        memberName: member.name,
        memberEmoji: member.emoji,
        image: null
      });
    }
  }
  return deck;
}

// Crée des cartes pour de nouvelles familles (à ajouter en cours de partie)
export function createCardsForFamilies(families) {
  const cards = [];
  for (const family of families) {
    for (const member of MEMBERS) {
      cards.push({
        id: `${family.id}-${member.id}`,
        familyId: family.id,
        familyName: family.name,
        familyColor: family.color,
        familyTheme: family.theme || '',
        memberId: member.id,
        memberName: member.name,
        memberEmoji: member.emoji,
        image: null
      });
    }
  }
  return cards;
}

// Mélange un tableau (Fisher-Yates shuffle)
export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Distribue les cartes aux joueurs
export function dealCards(deck, playerCount) {
  const hands = {};
  const cardsPerPlayer = config.game.cardsPerPlayer;
  const shuffled = shuffleDeck(deck);

  for (let i = 0; i < playerCount; i++) {
    hands[i] = shuffled.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer);
  }

  const drawPile = shuffled.slice(playerCount * cardsPerPlayer);

  return { hands, drawPile };
}

// Vérifie si un joueur possède au moins une carte d'une famille
export function hasCardFromFamily(hand, familyId) {
  return hand.some(card => card.familyId === familyId);
}

// Vérifie si un joueur possède une carte spécifique
export function hasCard(hand, familyId, memberId) {
  return hand.some(card => card.familyId === familyId && card.memberId === memberId);
}

// Trouve et retire une carte de la main
export function removeCard(hand, familyId, memberId) {
  const index = hand.findIndex(card => card.familyId === familyId && card.memberId === memberId);
  if (index !== -1) {
    return hand.splice(index, 1)[0];
  }
  return null;
}

// Vérifie si un joueur a complété une famille
export function checkCompletedFamily(hand, familyId) {
  const familyCards = hand.filter(card => card.familyId === familyId);
  return familyCards.length === 6;
}

// Extrait une famille complète de la main
export function extractCompletedFamily(hand, familyId) {
  const familyCards = [];
  for (let i = hand.length - 1; i >= 0; i--) {
    if (hand[i].familyId === familyId) {
      familyCards.push(hand.splice(i, 1)[0]);
    }
  }
  return familyCards;
}

// Compte les familles non complétées restantes dans le jeu
export function countRemainingFamilies(activeFamilyIds, completedFamilies) {
  const completedIds = new Set();
  for (const families of Object.values(completedFamilies)) {
    for (const family of families) {
      completedIds.add(family.familyId);
    }
  }

  return activeFamilyIds.filter(id => !completedIds.has(id)).length;
}

// Vérifie si on doit ajouter de nouvelles familles
export function shouldAddNewFamilies(activeFamilyIds, completedFamilies) {
  const remaining = countRemainingFamilies(activeFamilyIds, completedFamilies);
  return remaining <= config.game.newFamiliesThreshold;
}

// Calcule le score (nombre de familles complétées)
export function calculateScores(completedFamilies) {
  const scores = {};
  for (const [playerId, families] of Object.entries(completedFamilies)) {
    scores[playerId] = families.length;
  }
  return scores;
}

// Vérifie si la partie est terminée (uniquement quand pioche vide et plus de jeu possible)
export function isGameOver(drawPile, hands) {
  if (drawPile.length === 0) {
    // Vérifie si tous les joueurs ont des mains vides
    const allHandsEmpty = Object.values(hands).every(hand => hand.length === 0);
    if (allHandsEmpty) {
      return true;
    }

    // Vérifie combien de joueurs ont encore des cartes
    let playersWithCards = 0;
    for (const hand of Object.values(hands)) {
      if (hand.length > 0) playersWithCards++;
    }

    // Si un seul joueur a des cartes, il ne peut plus jouer
    if (playersWithCards <= 1) {
      return true;
    }
  }

  return false;
}

// Exporte les constantes
export { MEMBERS };
