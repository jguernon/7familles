# Guide de Déploiement - Jeu des 7 Familles

## Prérequis

- Node.js 18+
- Une clé API Google Gemini (pour la génération d'images)
- Un compte sur un service d'hébergement (Railway, Render, DigitalOcean, etc.)

## Option 1 : Railway (Recommandé - Le plus simple)

### Étapes

1. **Créer un compte** sur [railway.app](https://railway.app)

2. **Connecter GitHub**
   - Pushez votre code sur GitHub
   - Dans Railway, cliquez "New Project" > "Deploy from GitHub repo"

3. **Configurer les variables d'environnement**
   Dans les settings du projet Railway :
   ```
   NODE_ENV=production
   GEMINI_API_KEY=votre_cle_api_gemini
   ```

4. **Configurer le build**
   Railway détecte automatiquement Node.js. Ajoutez dans Settings > Build :
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

5. **Déployer**
   - Railway déploie automatiquement à chaque push
   - Votre jeu sera accessible sur une URL comme `votre-projet.up.railway.app`

### Coût estimé : ~$5/mois

---

## Option 2 : Render

### Étapes

1. **Créer un compte** sur [render.com](https://render.com)

2. **Créer un Web Service**
   - New > Web Service
   - Connecter votre repo GitHub
   - Runtime: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Variables d'environnement**
   ```
   NODE_ENV=production
   GEMINI_API_KEY=votre_cle_api_gemini
   ```

4. **Déployer**
   - Cliquez "Create Web Service"
   - URL: `votre-projet.onrender.com`

### Coût : Gratuit (avec limitations) ou $7/mois (starter)

---

## Option 3 : VPS (DigitalOcean, OVH, etc.)

### Étapes

1. **Créer un droplet/VPS** (Ubuntu 22.04 recommandé)

2. **Installer Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

3. **Cloner le projet**
   ```bash
   git clone https://github.com/votre-user/7-familles-game.git
   cd 7-familles-game
   ```

4. **Installer les dépendances et build**
   ```bash
   npm install
   npm run build
   ```

5. **Configurer l'environnement**
   ```bash
   cp .env.example .env
   nano .env  # Ajoutez votre GEMINI_API_KEY
   ```

6. **Installer PM2 (gestionnaire de processus)**
   ```bash
   sudo npm install -g pm2
   pm2 start server/src/index.js --name "7familles"
   pm2 startup
   pm2 save
   ```

7. **Configurer Nginx (reverse proxy)**
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/7familles
   ```

   Contenu :
   ```nginx
   server {
       listen 80;
       server_name votre-domaine.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/7familles /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

8. **SSL avec Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d votre-domaine.com
   ```

### Coût : ~$6/mois (DigitalOcean) ou ~$4/mois (OVH)

---

## Commandes utiles

### Déploiement local (test)
```bash
# Build le client
npm run build

# Lancer en mode production
NODE_ENV=production npm start
```

### Vérifier que tout fonctionne
```bash
# Tester la santé du serveur
curl http://localhost:3001/health
```

---

## Variables d'environnement

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `PORT` | Port du serveur (défaut: 3001) | Non |
| `NODE_ENV` | Environnement (`production` ou `development`) | Oui |
| `GEMINI_API_KEY` | Clé API Google Gemini | Oui |

---

## Obtenir une clé API Gemini

1. Allez sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Connectez-vous avec votre compte Google
3. Cliquez "Create API Key"
4. Copiez la clé et ajoutez-la à vos variables d'environnement

---

## Dépannage

### Le WebSocket ne se connecte pas
- Vérifiez que votre hébergeur supporte les WebSockets
- Railway et Render les supportent nativement

### Les images ne se génèrent pas
- Vérifiez que `GEMINI_API_KEY` est correctement configurée
- Consultez les logs du serveur

### Erreur de build
- Assurez-vous d'avoir Node.js 18+
- Supprimez `node_modules` et réinstallez : `rm -rf node_modules && npm install`
