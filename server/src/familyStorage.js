// Stockage persistant des familles générées
import fs from 'fs/promises';
import path from 'path';
import { config } from './config.js';

const FAMILIES_FILE = path.resolve(config.storage.familiesDir, 'families.json');

// Les 6 membres de chaque famille avec emojis
const MEMBERS = [
  { id: 'grandpere', name: 'Grand-père', emoji: '👴' },
  { id: 'grandmere', name: 'Grand-mère', emoji: '👵' },
  { id: 'pere', name: 'Père', emoji: '👨' },
  { id: 'mere', name: 'Mère', emoji: '👩' },
  { id: 'fils', name: 'Fils', emoji: '👦' },
  { id: 'fille', name: 'Fille', emoji: '👧' }
];

// Familles de base avec emojis métiers
const DEFAULT_FAMILIES = [
  { id: 'boulanger', name: 'Boulanger', emoji: '🥖', color: '#E74C3C' },
  { id: 'astronaute', name: 'Astronaute', emoji: '🚀', color: '#3498DB' },
  { id: 'magicien', name: 'Magicien', emoji: '🎩', color: '#9B59B6' },
  { id: 'pirate', name: 'Pirate', emoji: '🏴‍☠️', color: '#27AE60' },
  { id: 'inventeur', name: 'Inventeur', emoji: '⚙️', color: '#F39C12' },
  { id: 'explorateur', name: 'Explorateur', emoji: '🧭', color: '#1ABC9C' },
  { id: 'musicien', name: 'Musicien', emoji: '🎵', color: '#E67E22' },
  { id: 'docteur', name: 'Docteur', emoji: '🩺', color: '#E91E63' },
  { id: 'pompier', name: 'Pompier', emoji: '🚒', color: '#FF5722' },
  { id: 'policier', name: 'Policier', emoji: '🚔', color: '#2196F3' },
  { id: 'fermier', name: 'Fermier', emoji: '🌾', color: '#8BC34A' },
  { id: 'pecheur', name: 'Pêcheur', emoji: '🎣', color: '#00BCD4' },
  { id: 'cuisinier', name: 'Cuisinier', emoji: '👨‍🍳', color: '#FF9800' },
  { id: 'jardinier', name: 'Jardinier', emoji: '🌻', color: '#4CAF50' }
];

// Charge les familles depuis le fichier
export async function loadFamilies() {
  try {
    await fs.mkdir(path.dirname(FAMILIES_FILE), { recursive: true });
    const data = await fs.readFile(FAMILIES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    // Fichier n'existe pas, retourner les familles par défaut
    return { families: DEFAULT_FAMILIES, generatedCards: {} };
  }
}

// Sauvegarde les familles dans le fichier
export async function saveFamilies(data) {
  await fs.mkdir(path.dirname(FAMILIES_FILE), { recursive: true });
  await fs.writeFile(FAMILIES_FILE, JSON.stringify(data, null, 2));
}

// Obtient toutes les familles disponibles
export async function getAllFamilies() {
  const data = await loadFamilies();
  return data.families;
}

// Ajoute une nouvelle famille
export async function addFamily(family) {
  const data = await loadFamilies();
  data.families.push(family);
  await saveFamilies(data);
  return family;
}

// Crée un deck simple avec emojis
export function createSimpleDeck(families) {
  const deck = [];

  for (const family of families) {
    for (const member of MEMBERS) {
      deck.push({
        id: `${family.id}-${member.id}`,
        familyId: family.id,
        familyName: family.name,
        familyColor: family.color,
        familyEmoji: family.emoji,
        memberId: member.id,
        memberName: member.name,
        memberEmoji: member.emoji
      });
    }
  }

  return deck;
}

// Sélectionne des familles aléatoires pour une partie
export async function selectRandomFamilies(count = 7) {
  const allFamilies = await getAllFamilies();

  // Mélange les familles
  const shuffled = [...allFamilies].sort(() => Math.random() - 0.5);

  // On retourne le nombre demandé ou toutes si pas assez
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export { DEFAULT_FAMILIES, MEMBERS };
