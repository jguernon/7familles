// Configuration des APIs
export const config = {
  // Google Gemini API
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || 'AIzaSyBJRiUgbrbahy44Gl7UZ_KbqbBLirUvwMI',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    textModel: 'gemini-2.0-flash',
    imageModel: 'imagen-3.0-generate-002'
  },

  // Chemins de stockage (utilise STORAGE_PATH pour Railway volumes)
  storage: {
    familiesDir: process.env.STORAGE_PATH ? `${process.env.STORAGE_PATH}/families` : './data/families',
    imagesDir: process.env.STORAGE_PATH ? `${process.env.STORAGE_PATH}/images` : './data/images'
  },

  // Configuration du jeu
  game: {
    initialFamilies: 7,
    membersPerFamily: 6,
    cardsPerPlayer: 7,
    maxPlayers: 6,
    minPlayers: 2,
    newFamiliesThreshold: 1, // Quand il reste X familles non complétées, on en ajoute
    newFamiliesToAdd: 3 // Nombre de nouvelles familles à ajouter
  }
};
