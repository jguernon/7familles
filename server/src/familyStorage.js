// Stockage persistant des familles générées
import fs from 'fs/promises';
import path from 'path';
import { config } from './config.js';
import { generateFamilyCards, MEMBERS } from './imageGenerator.js';
import { generateFamilyIdea } from './familyGenerator.js';

const FAMILIES_FILE = path.resolve(config.storage.familiesDir, 'families.json');

// Familles de base (starter pack)
const DEFAULT_FAMILIES = [
  { id: 'boulanger', name: 'Boulanger', theme: 'baker, bread maker, pastry chef with flour and bread', color: '#E74C3C' },
  { id: 'astronaute', name: 'Astronaute', theme: 'astronaut, space explorer, cosmic traveler with spacesuit', color: '#3498DB' },
  { id: 'magicien', name: 'Magicien', theme: 'magician, wizard, illusionist with magic wand and hat', color: '#9B59B6' },
  { id: 'pirate', name: 'Pirate', theme: 'pirate, sea captain, buccaneer with ship and treasure', color: '#27AE60' },
  { id: 'inventeur', name: 'Inventeur', theme: 'inventor, scientist, engineer with gears and machines', color: '#F39C12' },
  { id: 'explorateur', name: 'Explorateur', theme: 'explorer, adventurer, jungle explorer with map and compass', color: '#1ABC9C' },
  { id: 'musicien', name: 'Musicien', theme: 'musician, orchestra conductor, composer with musical instruments', color: '#E67E22' }
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

// Génère et ajoute de nouvelles familles
export async function generateAndAddFamilies(count = 3) {
  const data = await loadFamilies();
  const existingIds = data.families.map(f => f.id);
  const newFamilies = [];

  for (let i = 0; i < count; i++) {
    const familyIdea = await generateFamilyIdea(existingIds);
    if (familyIdea) {
      data.families.push(familyIdea);
      existingIds.push(familyIdea.id);
      newFamilies.push(familyIdea);
      console.log(`Nouvelle famille ajoutée: ${familyIdea.name}`);
    }
  }

  await saveFamilies(data);
  return newFamilies;
}

// Crée un deck complet avec les images
export async function createDeckWithImages(familyIds) {
  const data = await loadFamilies();
  const deck = [];

  for (const familyId of familyIds) {
    const family = data.families.find(f => f.id === familyId);
    if (!family) continue;

    // Vérifie si les cartes sont déjà générées
    if (data.generatedCards[familyId]) {
      deck.push(...data.generatedCards[familyId]);
    } else {
      // Générer les cartes
      console.log(`Génération des cartes pour ${family.name}...`);
      const cards = await generateFamilyCards(family.id, family.name, family.theme, family.color);
      data.generatedCards[familyId] = cards;
      await saveFamilies(data);
      deck.push(...cards);
    }
  }

  return deck;
}

// Crée un deck simple sans images (pour le démarrage rapide)
export function createSimpleDeck(families) {
  const deck = [];

  for (const family of families) {
    for (const member of MEMBERS) {
      deck.push({
        id: `${family.id}-${member.id}`,
        familyId: family.id,
        familyName: family.name,
        familyColor: family.color,
        familyTheme: family.theme,
        memberId: member.id,
        memberName: member.name,
        memberEmoji: getEmojiForMember(member.id),
        image: null // Sera chargé à la demande
      });
    }
  }

  return deck;
}

// Emoji fallback pour chaque membre
function getEmojiForMember(memberId) {
  const emojis = {
    grandpere: '👴',
    grandmere: '👵',
    pere: '👨',
    mere: '👩',
    fils: '👦',
    fille: '👧'
  };
  return emojis[memberId] || '👤';
}

// Sélectionne des familles aléatoires pour une partie
export async function selectRandomFamilies(count = 7) {
  const allFamilies = await getAllFamilies();

  // Mélange les familles
  const shuffled = [...allFamilies].sort(() => Math.random() - 0.5);

  // Si pas assez de familles, en générer de nouvelles
  if (shuffled.length < count) {
    const needed = count - shuffled.length;
    const newFamilies = await generateAndAddFamilies(needed);
    shuffled.push(...newFamilies);
  }

  return shuffled.slice(0, count);
}

export { DEFAULT_FAMILIES, MEMBERS };
