# 📖 Prie avec moi

> Application mobile de méditation biblique avec espace administrateur et système de publications (newsfeed).

---

## ✨ À propos

**Prie avec moi** est une application mobile développée avec **React Native (Expo)** et une API backend en **Node.js + Express + Prisma + MySQL**.

L’objectif est d’offrir une expérience moderne de méditation biblique avec :

- 📚 Des séries de méditations
- 🎧 Des audios
- ⭐ Un système de favoris
- 📰 Un fil d’actualités (newsfeed)
- ❤️ Likes & commentaires
- 📅 Gestion d’évènements
- 👑 Un espace administrateur complet

---

# 🏗️ Architecture

```
/mobile     → Application React Native (Expo Router)
/api        → Backend Node.js (Express + Prisma)
/prisma     → Schéma & migrations base de données
```

---

# ⚙️ Stack Technique

## 📱 Mobile
- React Native (Expo)
- Expo Router
- Zustand (gestion d’authentification)
- Animated API
- TypeScript

## 🌐 Backend
- Node.js
- Express.js
- Prisma ORM
- MySQL
- JWT (authentification)
- Zod (validation)

---

# 🗄️ Base de Données (Prisma)

## 👤 User
- id
- fullName
- email (unique)
- passwordHash
- avatarUrl
- isAdmin
- createdAt
- updatedAt

Relations :
- favorites
- posts
- postLikes
- postComments

---

## 📚 Series
- title
- slug (unique)
- description
- coverUrl
- isPublished

---

## 📖 Meditation
- title
- slug
- bodyText
- audioUrl
- isPublished
- seriesId (optionnel)

---

## 📰 Post (Newsfeed)
- text
- isPublished
- authorId
- images
- likes
- comments
- createdAt

Fonctionnalités :
- Pagination stable (20 par 20)
- Tri du plus récent au plus ancien
- Like unique par utilisateur
- Commentaires

---

# 🔐 Authentification & Rôles

Authentification via **JWT**.

## 👤 Utilisateur
- Consulter les méditations
- Liker un post
- Commenter
- Ajouter aux favoris

## 👑 Administrateur
- Gérer séries
- Gérer méditations
- Gérer évènements
- Publier des posts
- Gérer les utilisateurs :
  - Voir détails
  - Modifier rôle
  - Supprimer

---

# 👑 Espace Administration

Routes protégées :

```
/admin/users
/admin/posts
/admin/series
/admin/meditations
/admin/events
```

Toutes les routes admin nécessitent :
- `authMiddleware`
- `adminMiddleware`

---

# 🚀 Installation

## 1️⃣ Cloner le projet

```bash
git clone https://github.com/ton-username/prie-avec-moi.git
cd prie-avec-moi
```

---

## 2️⃣ Backend

```bash
cd api
npm install
```

Créer un fichier `.env` :

```
DATABASE_URL="mysql://user:password@localhost:3306/prie_avec_moi"
JWT_SECRET="your_secret_key"
```

Lancer Prisma :

```bash
npx prisma migrate dev
npx prisma generate
```

Démarrer le serveur :

```bash
npm run dev
```

---

## 3️⃣ Mobile

```bash
cd mobile
npm install
npx expo start
```

---

# 📦 Scripts Utiles

## Backend

```bash
npm run dev
npx prisma studio
npx prisma migrate dev
```

## Mobile

```bash
npx expo start
npx expo start -c
```

---

# 🎨 Splash Screen

L’application inclut :

- Logo animé
- Effet de reflet dynamique
- Animation d’entrée progressive
- Navigation automatique selon état d’authentification

---

# 📈 Roadmap

- 🔔 Notifications push
- 💳 Système premium
- ☁️ Upload cloud (S3 / Cloudinary)
- 🌍 Multi-langue
- 📊 Dashboard analytics admin

---

# 🛡️ Sécurité

- JWT sécurisé
- Middleware admin dédié
- Validation Zod
- Prisma cascade
- Protection contre double like

---

# 📄 Licence

Projet privé – Tous droits réservés.

---

# 👨‍💻 Auteur

Développé par **GoulBAM Enterprises**  
📩 Contact : goulbam8@gmail.com