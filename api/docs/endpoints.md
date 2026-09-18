````md
# Prie avec moi — API (MVP) Endpoints

Base URL (dev) : `http://localhost:4000`  
Auth : **JWT Bearer Token** dans `Authorization: Bearer <token>`

---

## 1) Health

### GET `/health`
**Description** : Vérifie que l’API tourne.

**Response 200**
```json
{ "ok": true }
````

---

## 2) Auth

### POST `/auth/signup`

**Description** : Créer un compte utilisateur.

**Body (JSON)**

```json
{
  "fullName": "Utilisateur Prie",
  "email": "user@prieavecmoi.app",
  "password": "password"
}
```

**Response 201**

```json
{
  "user": {
    "id": "clx...",
    "fullName": "Utilisateur Prie",
    "email": "user@prieavecmoi.app",
    "avatarUrl": null,
    "isAdmin": false
  },
  "token": "JWT_TOKEN"
}
```

**Errors**

* `409` Email already used
* `400` Validation error

---

### POST `/auth/signin`

**Description** : Se connecter (retourne token).

**Body (JSON)**

```json
{
  "email": "user@prieavecmoi.app",
  "password": "password"
}
```

**Response 200**

```json
{
  "user": {
    "id": "clx...",
    "fullName": "Utilisateur Prie",
    "email": "user@prieavecmoi.app",
    "avatarUrl": "https://...",
    "isAdmin": false
  },
  "token": "JWT_TOKEN"
}
```

**Errors**

* `401` Invalid credentials
* `400` Validation error

---

## 3) Account (Compte)

> Toutes ces routes nécessitent : `Authorization: Bearer <token>`

### GET `/account/me`

**Description** : Récupérer le profil de l’utilisateur connecté.

**Headers**

* `Authorization: Bearer <token>`

**Response 200**

```json
{
  "user": {
    "id": "clx...",
    "fullName": "Utilisateur Prie",
    "email": "user@prieavecmoi.app",
    "avatarUrl": "https://...",
    "isAdmin": false,
    "createdAt": "2026-02-14T..."
  }
}
```

**Errors**

* `401` Unauthorized / Invalid token
* `404` User not found

---

### PATCH `/account/me`

**Description** : Mettre à jour le profil.

**Headers**

* `Authorization: Bearer <token>`

**Body (JSON)**

```json
{
  "fullName": "Nouveau Nom",
  "avatarUrl": "https://picsum.photos/seed/user/200/200"
}
```

**Response 200**

```json
{
  "user": {
    "id": "clx...",
    "fullName": "Nouveau Nom",
    "email": "user@prieavecmoi.app",
    "avatarUrl": "https://picsum.photos/seed/user/200/200",
    "isAdmin": false
  }
}
```
DELETE /account

**Errors**

* `401` Unauthorized / Invalid token
* `400` Validation error

---

## 4) Series

### GET `/series`

**Description** : Liste des séries **publiées**.

**Response 200**

```json
{
  "series": [
    {
      "id": "clx...",
      "title": "21 jours de foi",
      "slug": "21-jours-de-foi",
      "description": " ... ",
      "coverUrl": "https://...",
      "createdAt": "2026-02-14T...",
      "_count": { "meditations": 3 }
    }
  ]
}
```

---

### GET `/series/:slug`

**Description** : Détails d’une série + liste des méditations publiées.

**Params**

* `slug` (string)

**Response 200**

```json
{
  "series": {
    "id": "clx...",
    "title": "21 jours de foi",
    "slug": "21-jours-de-foi",
    "description": " ... ",
    "coverUrl": "https://...",
    "meditations": [
      {
        "id": "clx...",
        "title": "Un pas de foi",
        "slug": "un-pas-de-foi",
        "imageUrl": "https://...",
        "audioDuration": "06:12",
        "createdAt": "2026-02-14T..."
      }
    ]
  }
}
```

**Errors**

* `404` Series not found

---

## 5) Meditations

### GET `/meditations/daily`

**Description** : Méditation du jour (MVP : dernière publiée).

**Response 200**

```json
{
  "meditation": {
    "id": "clx...",
    "title": "La paix qui garde le cœur",
    "slug": "la-paix-qui-garde-le-coeur",
    "imageUrl": "https://...",
    "bodyText": " ... ",
    "footerText": " ... ",
    "audioUrl": "https://...",
    "audioDuration": "07:34",
    "seriesId": null
  }
}
```

---

### GET `/meditations/:slug`

**Description** : Détails complets d’une méditation.

**Params**

* `slug` (string)

**Response 200**

```json
{
  "meditation": {
    "id": "clx...",
    "title": "Un pas de foi",
    "slug": "un-pas-de-foi",
    "imageUrl": "https://...",
    "bodyText": " ... ",
    "footerText": " ... ",
    "audioUrl": "https://...",
    "audioDuration": "06:12",
    "series": {
      "id": "clx...",
      "title": "21 jours de foi",
      "slug": "21-jours-de-foi"
    },
    "createdAt": "2026-02-14T..."
  }
}
```

**Errors**

* `404` Meditation not found

---

## 6) Favorites (Favoris)

> Toutes ces routes nécessitent : `Authorization: Bearer <token>`

### GET `/favorites`

**Description** : Liste des favoris de l’utilisateur connecté.

**Headers**

* `Authorization: Bearer <token>`

**Response 200**

```json
{
  "favorites": [
    {
      "id": "clx...",
      "createdAt": "2026-02-14T...",
      "meditation": {
        "id": "clx...",
        "title": "La paix qui garde le cœur",
        "slug": "la-paix-qui-garde-le-coeur",
        "imageUrl": "https://...",
        "audioDuration": "07:34"
      }
    }
  ]
}
```

---

### POST `/favorites/:meditationId`

**Description** : Ajouter une méditation aux favoris (idempotent).

**Headers**

* `Authorization: Bearer <token>`

**Params**

* `meditationId` (string)

**Response 201**

```json
{
  "favorite": {
    "id": "clx...",
    "createdAt": "2026-02-14T..."
  }
}
```

**Errors**

* `401` Unauthorized / Invalid token
* `404` si la meditationId n’existe pas (selon contrainte DB)

---

### DELETE `/favorites/:meditationId`

**Description** : Retirer une méditation des favoris.

**Headers**

* `Authorization: Bearer <token>`

**Params**

* `meditationId` (string)

**Response 200**

```json
{ "ok": true }
```

**Errors**

* `401` Unauthorized / Invalid token
* `404` Favorite not found (si déjà supprimé selon Prisma delete)

---

## 7) Conventions

* Format des réponses : JSON
* Auth : JWT dans `Authorization: Bearer <token>`
* Slug : utilisé côté mobile pour navigation et accès direct
* MVP : pas de pagination; possible en V2.

---

## 8) Exemple rapide (curl)

### Sign in

```bash
curl -X POST http://localhost:4000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"user@prieavecmoi.app","password":"password"}'
```

### Account me (avec token)

```bash
curl http://localhost:4000/account/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### List series

```bash
curl http://localhost:4000/series
```
## Events (Public)

GET /events
- Liste des évènements publiés (tri startDate ASC)

GET /events/home
- Évènements en cours + à venir (endDate >= now), tri startDate ASC

GET /events/:id
- Détail d’un évènement

## Admin Events

GET /admin/events
GET /admin/events/:id
POST /admin/events
PATCH /admin/events/:id
DELETE /admin/events/:id
POST /admin/events/:id/publish
POST /admin/events/:id/unpublish


```
```
