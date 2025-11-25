// Service de génération d'images avec Google Gemini
import { config } from './config.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEMBERS = [
  { id: 'grandpere', name: 'Grand-père', description: 'elderly man, grandfather, wise old man with white hair' },
  { id: 'grandmere', name: 'Grand-mère', description: 'elderly woman, grandmother, kind old woman with white hair' },
  { id: 'pere', name: 'Père', description: 'middle-aged man, father figure, adult man' },
  { id: 'mere', name: 'Mère', description: 'middle-aged woman, mother figure, adult woman' },
  { id: 'fils', name: 'Fils', description: 'young boy, son, teenage boy or child' },
  { id: 'fille', name: 'Fille', description: 'young girl, daughter, teenage girl or child' }
];

// Style artistique rétro vintage 1940s-50s avec éléments steampunk
const ART_STYLE = `
VINTAGE 1940s-1950s portrait photography style, sepia toned photograph,
retro family portrait aesthetic like old photo albums,
warm brown and cream sepia color palette, aged paper texture look,
soft vintage lighting, slightly faded like an old photograph,
character wearing period-appropriate clothing with subtle steampunk accessories (round glasses, goggles, brass buttons),
background with vintage machinery, gears, copper pipes, steam elements
`;

// Génère une image avec Gemini 2.0 Flash (experimental image generation)
async function generateImage(prompt) {
  // Utilise le modèle gemini-2.0-flash-exp pour la génération d'images
  const url = `${config.gemini.baseUrl}/gemini-2.0-flash-exp-image-generation:generateContent?key=${config.gemini.apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"]
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur Gemini API:', response.status, errorText);

      // Essayer avec imagen-3.0-generate-001 comme fallback
      return await generateImageWithImagen(prompt);
    }

    const data = await response.json();

    // Chercher l'image dans la réponse
    if (data.candidates && data.candidates[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
          console.log('Image générée avec succès via Gemini 2.0 Flash');
          return part.inlineData.data;
        }
      }
    }

    console.log('Pas d\'image dans la réponse, essai avec Imagen...');
    return await generateImageWithImagen(prompt);
  } catch (error) {
    console.error('Erreur lors de la génération d\'image:', error.message);
    return await generateImageWithImagen(prompt);
  }
}

// Fallback: Génère une image avec Imagen 3
async function generateImageWithImagen(prompt) {
  const url = `${config.gemini.baseUrl}/imagen-3.0-generate-001:predict?key=${config.gemini.apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: '3:4',
          safetyFilterLevel: 'block_only_high',
          personGeneration: 'allow_adult'
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Erreur Imagen API:', response.status, error);
      return null;
    }

    const data = await response.json();

    if (data.predictions && data.predictions[0]?.bytesBase64Encoded) {
      console.log('Image générée avec succès via Imagen 3');
      return data.predictions[0].bytesBase64Encoded;
    }

    return null;
  } catch (error) {
    console.error('Erreur Imagen:', error.message);
    return null;
  }
}

// Génère le prompt pour un portrait vintage rétro
function buildCardPrompt(familyName, familyTheme, member) {
  return `
${ART_STYLE}

Vintage 1940s sepia photograph portrait of a ${member.description} who works as a ${familyTheme}.
Dressed in 1940s-1950s style work uniform or professional attire for ${familyTheme}, with round vintage glasses or steampunk goggles.
Holding tools or equipment related to ${familyTheme} profession.
Posed like an old family photo, warm friendly expression.
Sepia brown tones, aged photograph aesthetic, steampunk industrial background with gears and pipes.
  `.trim();
}

// Génère toutes les cartes d'une famille
export async function generateFamilyCards(familyId, familyName, familyTheme, color) {
  console.log(`Génération des cartes pour la famille ${familyName}...`);

  const cards = [];
  const imagesDir = path.resolve(config.storage.imagesDir);

  // Créer le dossier si nécessaire
  await fs.mkdir(imagesDir, { recursive: true });

  for (const member of MEMBERS) {
    const cardId = `${familyId}-${member.id}`;
    const imagePath = path.join(imagesDir, `${cardId}.png`);

    // Vérifie si l'image existe déjà
    try {
      await fs.access(imagePath);
      console.log(`  ✓ ${member.name} - Image existante`);

      // Lire l'image existante en base64
      const imageBuffer = await fs.readFile(imagePath);
      const imageBase64 = imageBuffer.toString('base64');

      cards.push({
        id: cardId,
        familyId,
        familyName,
        familyColor: color,
        memberId: member.id,
        memberName: member.name,
        image: `data:image/png;base64,${imageBase64}`
      });
    } catch {
      // Image n'existe pas, la générer
      console.log(`  ⏳ ${member.name} - Génération en cours...`);

      const prompt = buildCardPrompt(familyName, familyTheme, member);
      const imageBase64 = await generateImage(prompt);

      if (imageBase64) {
        // Sauvegarder l'image
        const imageBuffer = Buffer.from(imageBase64, 'base64');
        await fs.writeFile(imagePath, imageBuffer);
        console.log(`  ✓ ${member.name} - Générée et sauvegardée`);

        cards.push({
          id: cardId,
          familyId,
          familyName,
          familyColor: color,
          memberId: member.id,
          memberName: member.name,
          image: `data:image/png;base64,${imageBase64}`
        });
      } else {
        console.log(`  ✗ ${member.name} - Échec de génération`);
        // Carte sans image (fallback)
        cards.push({
          id: cardId,
          familyId,
          familyName,
          familyColor: color,
          memberId: member.id,
          memberName: member.name,
          image: null
        });
      }

      // Petite pause pour éviter le rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return cards;
}

// Génère une seule carte
export async function generateSingleCard(familyId, familyName, familyTheme, color, memberId) {
  const member = MEMBERS.find(m => m.id === memberId);
  if (!member) {
    console.error(`Membre ${memberId} non trouvé`);
    return null;
  }

  const imagesDir = path.resolve(__dirname, '../data/images');
  await fs.mkdir(imagesDir, { recursive: true });

  const cardId = `${familyId}-${memberId}`;
  const imagePath = path.join(imagesDir, `${cardId}.png`);

  // Vérifie si l'image existe déjà
  try {
    await fs.access(imagePath);
    console.log(`✓ Image existante pour ${cardId}`);
    const imageBuffer = await fs.readFile(imagePath);
    const imageBase64 = imageBuffer.toString('base64');

    return {
      id: cardId,
      familyId,
      familyName,
      familyColor: color,
      memberId: member.id,
      memberName: member.name,
      image: `data:image/png;base64,${imageBase64}`
    };
  } catch {
    // Générer l'image
    console.log(`⏳ Génération de ${member.name} pour ${familyName}...`);
    const prompt = buildCardPrompt(familyName, familyTheme, member);
    const imageBase64 = await generateImage(prompt);

    if (imageBase64) {
      const imageBuffer = Buffer.from(imageBase64, 'base64');
      await fs.writeFile(imagePath, imageBuffer);
      console.log(`✓ ${member.name} généré et sauvegardé`);

      return {
        id: cardId,
        familyId,
        familyName,
        familyColor: color,
        memberId: member.id,
        memberName: member.name,
        image: `data:image/png;base64,${imageBase64}`
      };
    }

    return {
      id: cardId,
      familyId,
      familyName,
      familyColor: color,
      memberId: member.id,
      memberName: member.name,
      image: null
    };
  }
}

// Génère une nouvelle famille avec un thème aléatoire
export async function generateNewFamily(existingFamilyIds = []) {
  const { generateFamilyIdea } = await import('./familyGenerator.js');

  // Générer une idée de famille avec Gemini
  const familyIdea = await generateFamilyIdea(existingFamilyIds);

  if (!familyIdea) {
    console.error('Impossible de générer une idée de famille');
    return null;
  }

  console.log(`Nouvelle famille générée: ${familyIdea.name} (${familyIdea.theme})`);

  // Générer les cartes
  const cards = await generateFamilyCards(
    familyIdea.id,
    familyIdea.name,
    familyIdea.theme,
    familyIdea.color
  );

  return {
    ...familyIdea,
    cards
  };
}

export { MEMBERS };
