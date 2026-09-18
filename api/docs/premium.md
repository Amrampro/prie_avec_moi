# Système Premium — Prie avec moi

## Architecture et fonctionnement

La fonctionnalité réutilise Express, les modules service/controller/routes, les middlewares JWT, Prisma/MySQL et les écrans Expo Router existants. Aucun paiement ni seconde architecture n’est ajouté.

`User.premiumStartAt` et `User.premiumEndAt` sont les seules données d’abonnement. `isPremium` est calculé côté serveur : `premiumEndAt > maintenant`. Le statut expire automatiquement, sans tâche planifiée. Les réponses de connexion, inscription et compte incluent ce statut et les dates.

Un code normalisé (espaces extérieurs retirés, majuscules) est unique et utilisable une seule fois. La durée utilise `DAYS`, `MONTHS` ou `YEARS`. Les mois/années sont calendaires : le dernier jour est ajusté lorsque le mois cible est plus court. Une activation démarre maintenant si le compte est gratuit/expiré ; sinon elle prolonge la date de fin existante.

L’activation verrouille le compte, puis le code avec `SELECT … FOR UPDATE` dans une transaction `ReadCommitted`. La mise à jour du compte, la consommation du code et l’historique réussissent ou sont annulés ensemble. Cela protège aussi deux codes différents utilisés simultanément par un même compte. Les conflits Prisma `P2034` sont réessayés jusqu’à trois fois.

Les codes générés contiennent 128 bits aléatoires. Les codes manuels font 8 à 80 caractères (`A-Z`, chiffres, tirets). L’administration permet la création, la pagination, la consultation de l’utilisateur/date d’utilisation et la désactivation. L’expiration d’un code disponible est calculée à la lecture et contrôlée à l’activation ; il n’est pas nécessaire de mettre son statut SQL à jour à minuit. Un code désactivé ne révoque pas un abonnement déjà acquis ; les codes utilisés ne sont pas désactivables.

## Schéma et migration

Migration : `prisma/migrations/20260917090000_add_premium/migration.sql`.

- `user` : deux colonnes nullable `premiumStartAt`, `premiumEndAt`.
- `meditation` : `isPremium`, booléen avec défaut `false`. Toutes les méditations existantes restent gratuites.
- `premium_code` : code unique, durée/unité, statut, création, expiration facultative, utilisateur/date d’utilisation.
- `premium_activation` : historique avec ancien/nouveau terme et un code unique par activation.
- La suppression d’un compte met les relations d’historique à `NULL` et ne rend jamais ses codes réutilisables.

Aucune donnée existante n’est supprimée. La migration a été exécutée sur une base locale isolée avec un utilisateur créé avant migration : cet utilisateur est conservé et ses dates Premium restent nulles.

Pour mettre à jour la base de l’application, depuis le dossier `api`, avec le `DATABASE_URL` de l’environnement concerné :

```sh
npx prisma migrate deploy
npm run prisma:gen
```

Redémarrer ensuite l’API et déployer la nouvelle application mobile. La base configurée dans le `.env` existant n’a pas été modifiée pendant les tests. Le SQL cible les noms minuscules déjà présents dans `@@map` et le SQL actuel du projet ; l’historique ancien utilise aussi des noms avec majuscules. Sur une installation MySQL Linux sensible à la casse, vérifier ces noms avant le déploiement, sans rejouer ni réécrire les anciennes migrations.

## API

Toutes les routes ci-dessous utilisent le préfixe `/api`.

| Méthode | Route | Accès | Fonction |
| --- | --- | --- | --- |
| POST | `/premium/activate` | Connecté | `{ "code": "PRIE-…" }` ; retourne statut et dates |
| GET | `/premium/status` | Connecté | `isPremium`, `premiumStartAt`, `premiumEndAt` |
| GET | `/admin/premium-codes?page=1` | Administrateur | 50 codes maximum, utilisateur/historique, `nextPage` |
| POST | `/admin/premium-codes` | Administrateur | `duration`, `durationUnit`, `code` facultatif, `expiresAt` ISO facultatif |
| PATCH | `/admin/premium-codes/:id` | Administrateur | `{ "status": "DISABLED" }` |
| POST | `/admin/uploads/premium-audio` | Administrateur | Multipart `file`, audio jusqu’à 100 Mo, stockage privé |
| GET | `/meditations/:slug/audio` | Selon la méditation | Lecture du fichier local, avec support des requêtes Range |

Les routes administrateur des codes et des imports Premium revérifient le rôle en base. Une ancienne session d’un administrateur rétrogradé ne suffit pas.

Exemple de création :

```json
{ "duration": 3, "durationUnit": "MONTHS", "expiresAt": "2027-01-01T00:00:00Z" }
```

L’activation renvoie HTTP 400 avec `INVALID_CODE`, `CODE_USED`, `CODE_EXPIRED` ou `CODE_DISABLED`. Un accès Premium refusé renvoie HTTP 403 :

```json
{ "message": "Cette méditation est réservée aux utilisateurs Premium.", "code": "PREMIUM_REQUIRED" }
```

La limite est de 10 tentatives d’activation par compte sur 15 minutes et par processus API (HTTP 429 ensuite). Dans un déploiement à plusieurs instances, utiliser également un limiteur partagé au niveau du proxy ou d’un stockage commun.

## Méditations et audio

Les formulaires de création/modification proposent « Accessible à tous » et « Premium uniquement ». Les listes, séries et favoris affichent un badge Premium. Le détail demande une autorisation au serveur ; un refus affiche une invitation à activer Premium. Le retour depuis l’activation recharge le détail.

Les aperçus Premium destinés aux utilisateurs gratuits n’incluent ni `bodyText`, ni `footerText`, ni `audioUrl`. La méditation du jour reste visible avec `isLocked: true`. Les brouillons ne sont pas accessibles par le détail public.

Pour ajouter un audio Premium, choisir d’abord « Premium uniquement », puis « Importer un fichier audio ». Les fichiers sont enregistrés dans `api/private-audio/`, jamais dans `uploads/`, et lus via la route autorisée `/api/meditations/:slug/audio`. Les noms opaques enregistrés en base ne sont pas des liens de téléchargement publics. Un audio public déjà importé doit être réimporté en mode Premium ; son ancienne copie publique reste publique, ce qui évite de supprimer ou déplacer un fichier potentiellement réutilisé ailleurs. Ne pas considérer qu’un contenu déjà distribué publiquement peut être rendu secret rétroactivement.

Les URL audio publiques externes sont refusées pour Premium. Le middleware `/uploads` protège aussi les fichiers d’anciennes méditations marquées Premium directement en base. La lecture par une autre méditation utilisant le même fichier ne contourne pas cette protection. Les réponses protégées portent `Cache-Control: private, no-store`.

Configuration d’hébergement : ne jamais exposer `private-audio/` comme répertoire statique ou document root ; sauvegarder ce dossier comme les autres médias. Pour bénéficier de la protection des anciens fichiers publics, faire passer `/uploads` par Express plutôt que par un alias statique Nginx/Apache, et purger les caches publics antérieurs lors d’un changement d’accès. Aucun changement du serveur distant n’a été effectué.

## Vérifications

- Validation du schéma Prisma et génération du client : réussies.
- Vérification TypeScript de l’application : réussie.
- Export web Expo : réussi (46 routes). L’outil affiche uniquement l’avertissement de dépréciation de la bibliothèque `expo-av` déjà utilisée dans le projet.
- 19 tests unitaires et d’intégration réussis sur une instance MySQL/MariaDB locale isolée : accès gratuit/Premium, expiration, erreurs des codes, cumul, activation concurrente d’un même code, cumul concurrent de deux codes, transaction annulée si l’historique échoue, non-divulgation par listes/séries/favoris, accès audio direct/HEAD/Range/chemin encodé, administration et import privé, limitation des tentatives.
- Aucun test manuel sur téléphone physique n’a été effectué.

Depuis `api`, `npm test` exécute les tests unitaires et ignore les tests d’intégration si `PREMIUM_TEST_DATABASE_URL` est absent. Pour les tests complets, préparer une base locale jetable dont le nom contient `premium_test`, y appliquer le schéma, puis définir `PREMIUM_TEST_DATABASE_URL` avec son URL MySQL. Les tests refusent une base distante ou sans ce marqueur et nettoient uniquement leurs propres données.

## Variables d’environnement

Aucune nouvelle variable requise pour l’application. `DATABASE_URL`, `JWT_SECRET` et le `PUBLIC_BASE_URL` existant sont réutilisés. `PREMIUM_TEST_DATABASE_URL` sert exclusivement aux tests d’intégration.

## Fichiers créés

Dans `api/` :

- `prisma/migrations/20260917090000_add_premium/migration.sql`
- `src/modules/premium/premium.logic.js`
- `src/modules/premium/premium.service.js`
- `src/modules/premium/premium.controller.js`
- `src/modules/premium/premium.routes.js`
- `src/modules/admin-premium-codes/admin.premium.service.js`
- `src/modules/admin-premium-codes/admin.premium.controller.js`
- `src/modules/admin-premium-codes/admin.premium.routes.js`
- `src/modules/meditations/meditation.audio.js`
- `tests/premium.test.js`
- `tests/premium.integration.test.js`
- `docs/premium.md`

Dans `mobile/` :

- `services/premium.api.ts`
- `components/PremiumAccount.tsx`
- `app/settings/premium.tsx`
- `app/settings/admin/premium-codes.tsx`

## Fichiers modifiés pour Premium

Dans `api/` :

- `.gitignore`, `package.json`, `prisma/schema.prisma`, `src/app.js`
- `src/middlewares/error.middleware.js`
- `src/modules/auth/auth.service.js`, `src/modules/account/account.service.js`
- `src/modules/admin-meditations/admin.meditation.service.js`
- `src/modules/meditations/meditation.controller.js`, `meditation.routes.js`, `meditation.service.js`
- `src/modules/series/series.service.js`, `src/modules/favorites/favorite.service.js`
- `src/modules/uploads/uploads.routes.js`
- Client Prisma généré dans `node_modules/.prisma/client/` (déjà suivi par le dépôt).

Dans `mobile/` :

- `services/api.client.ts`, `auth.api.ts`, `meditations.api.ts`, `admin.meditations.api.ts`, `series.api.ts`, `favorites.api.ts`, `uploads.api.ts`
- `app/settings/index.tsx`, `app/settings/_layout.tsx`, `app/settings/admin/_layout.tsx`
- `app/settings/admin/meditations/new.tsx`, `app/settings/admin/meditations/[id].tsx`
- `app/meditation/[slug].tsx`, `app/meditation/other-meditations.tsx`
- `app/(tabs)/index.tsx`, `app/(tabs)/favorites.tsx`, `app/series/[slug].tsx`
- Types des routes Expo régénérés dans `.expo/types/router.d.ts` (fichier local généré).

Les autres modifications déjà présentes dans les deux dépôts ne font pas partie de cette fonctionnalité.
