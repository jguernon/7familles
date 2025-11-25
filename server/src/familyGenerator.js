// Générateur de nouvelles familles avec Gemini
import { config } from './config.js';

// Couleurs disponibles pour les familles
const COLORS = [
  '#E74C3C', '#3498DB', '#27AE60', '#9B59B6', '#1ABC9C',
  '#F39C12', '#E67E22', '#2ECC71', '#E91E63', '#00BCD4',
  '#FF5722', '#795548', '#607D8B', '#8BC34A', '#FFEB3B',
  '#673AB7', '#009688', '#FF9800', '#3F51B5', '#CDDC39'
];

// Génère une idée de famille unique avec Gemini
export async function generateFamilyIdea(existingFamilyIds = []) {
  const url = `${config.gemini.baseUrl}/${config.gemini.textModel}:generateContent?key=${config.gemini.apiKey}`;

  const existingList = existingFamilyIds.length > 0
    ? `Familles existantes à éviter: ${existingFamilyIds.join(', ')}`
    : 'Aucune famille existante';

  const prompt = `
Tu es un créateur de jeu de cartes des 7 familles.
Génère UNE nouvelle famille unique et créative pour le jeu.

${existingList}

La famille doit être:
- Un métier, une profession ou un thème intéressant
- Facilement illustrable de manière vintage/rétro/surréaliste
- Différente des familles existantes
- Appropriée pour tous les âges

Réponds UNIQUEMENT en JSON valide avec ce format exact:
{
  "id": "identifiant_simple_sans_accent",
  "name": "Nom de la Famille",
  "theme": "Description courte du thème/métier pour l'illustration"
}

Exemples de bonnes familles: Astronaute, Magicien, Pirate, Inventeur, Explorateur, Chocolatier, Horloger, Acrobate, Détective, Jardinier, Photographe, Pilote, Chef cuisinier, Bibliothécaire, Apiculteur...
`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 256,
          topK: 40,
          topP: 0.95
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Erreur Gemini API:', error);
      return null;
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      console.error('Pas de contenu dans la réponse Gemini');
      return null;
    }

    // Extraire le JSON de la réponse
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Pas de JSON trouvé dans la réponse:', textContent);
      return null;
    }

    const familyData = JSON.parse(jsonMatch[0]);

    // Assigner une couleur aléatoire non utilisée
    const usedColors = existingFamilyIds.length;
    const colorIndex = usedColors % COLORS.length;
    familyData.color = COLORS[colorIndex];

    return familyData;
  } catch (error) {
    console.error('Erreur lors de la génération de famille:', error);
    return null;
  }
}

// Génère plusieurs familles d'un coup
export async function generateMultipleFamilies(count, existingFamilyIds = []) {
  const families = [];
  const allIds = [...existingFamilyIds];

  for (let i = 0; i < count; i++) {
    const family = await generateFamilyIdea(allIds);
    if (family) {
      families.push(family);
      allIds.push(family.id);
    }
    // Pause entre les appels
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return families;
}
