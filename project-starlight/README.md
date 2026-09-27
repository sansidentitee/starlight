# Project Starlight

Un espace de travail personnel pour étudier, planifier et progresser : 13 vues, un centre de commandes global, une matrice d’Eisenhower et un espace de concentration. L’interface reprend l’ambiance de la référence : ivoire chaud, verre dépoli, grands arrondis, lumière rose et ambre, lac alpin et sphères translucides.

Le projet fonctionne immédiatement en démonstration locale. La connexion à Supabase est optionnelle et demande votre propre projet. Le dépôt contient la configuration pour GitHub Codespaces et Vercel ; aucun service distant n’est créé ou publié automatiquement.

## Démarrage en local

Prérequis : **Node.js 22 ou supérieur**, npm, et un navigateur récent. Le fichier `package-lock.json` fixe les dépendances installées.

1. Décompressez le projet ou clonez votre dépôt.
2. Ouvrez le dossier `project-starlight`, celui qui contient `package.json`. Toutes les commandes suivantes se lancent depuis ce dossier.
3. Installez puis démarrez :

```bash
npm ci
npm run dev
```

4. Ouvrez **http://localhost:3000**.

Aucune variable d’environnement n’est nécessaire pour la démonstration. Les modifications de ce mode sont enregistrées dans le stockage local du navigateur et conservées au rechargement, sous réserve que ce stockage soit disponible. Elles ne passent pas automatiquement d’un navigateur, appareil ou domaine à l’autre.

Pour vérifier une version de production locale :

```bash
npm run build
npm start
```

Arrêtez le serveur de développement avant `npm start` pour libérer le port 3000.

## Pages et usages

| Vue | Usage principal |
| --- | --- |
| Dashboard / Command Center | Vue d’ensemble des tâches, du travail concentré et de la progression. |
| Tasks | Inbox, création et suivi des tâches, matrice d’Eisenhower. |
| Focus / Deep Work | Minuteur de concentration, pauses et sessions enregistrées. |
| Calendar / Timeline | Planification des événements et des tâches. |
| Subjects / Knowledge Map | Matières, chapitres et maîtrise des connaissances. |
| Revision Engine | Révision de cartes et replanification selon la difficulté. |
| Analytics | Indicateurs issus des données présentes dans votre espace. |
| Grades | Notes, coefficients et moyenne ramenée sur 20. |
| Goals | Objectifs et suivi de leurs étapes. |
| Notes / Second Brain | Notes personnelles reliées aux matières. |
| Library / Resources | Liens et ressources d’étude. |
| Strategy / Weekly Review | Bilan de semaine et préparation de la suivante. |
| Settings / System | Préférences visuelles, paramètres et connexion Supabase. |

Ouvrez le centre de commandes avec **Cmd+K** sur Mac ou **Ctrl+K** sur Windows/Linux. Il recherche et ouvre les pages, tâches, notes, matières et ressources de votre espace. Utilisez les flèches pour sélectionner un résultat, Entrée pour l’ouvrir et Échap pour fermer. La création et la modification s’effectuent ensuite dans la page correspondante.

Dans Tasks, déplacez les tâches de l’Inbox vers **Do first**, **Schedule**, **Delegate** ou **Let go**. Le déplacement est prévu pour la souris et le tactile ; au clavier, placez le focus sur la poignée, utilisez Espace pour saisir/déposer, les flèches pour vous déplacer et Échap pour annuler. Le menu de déplacement de chaque tâche permet également de choisir directement son quadrant.

Dans Calendar, faites glisser une tâche depuis la liste latérale vers un créneau, ou déplacez un événement existant. Ce calendrier utilise le glisser-déposer natif du navigateur. Sur écran tactile ou au clavier, utilisez **Schedule** pour ouvrir le formulaire de planification ; ouvrez un événement pour modifier sa date, son heure ou sa durée. Une échéance de tâche et un créneau de calendrier restent deux informations distinctes.

Le minuteur Focus continue pendant la navigation entre les pages de l’application. Une session en cours n’est pas restaurée après un rechargement complet ou la fermeture de l’onglet : terminez et enregistrez la session avant de quitter pour conserver le temps écoulé. Les sessions déjà enregistrées font partie des données sauvegardées de l’espace.

Dans **Settings → Your data belongs to you**, **Export backup** télécharge un fichier JSON contenant l’ensemble de l’espace : données et paramètres, sans mot de passe ni jeton de connexion. **Import backup** restaure un fichier Starlight de version 1, de 5 Mo au maximum, après validation et confirmation ; il remplace l’espace courant. Exportez donc une copie avant de restaurer un autre fichier. Les éléments imbriqués, types de champs, dates, bornes numériques, identifiants uniques et paramètres sont contrôlés à l’exécution avant l’import.

Les cartes de révision utilisent un espacement simple selon la réponse ; il s’agit d’un outil de pratique, pas d’un modèle adaptatif d’apprentissage validé. Les données initiales sont des exemples modifiables, et les dates de démonstration sont générées par l’application.

## GitHub Codespaces

1. Créez un dépôt GitHub et placez **le contenu de ce dossier à sa racine**, y compris les fichiers cachés `.devcontainer`, `.env.example` et `.gitignore`. Ne publiez pas `.env.local`, `node_modules` ou `.next`.
2. Depuis le dépôt, ouvrez **Code → Codespaces → Create codespace on main**.
3. La configuration `.devcontainer/devcontainer.json` prépare Node 22 et exécute `npm ci`. Attendez la fin de cette installation.
4. Dans le terminal du Codespace, lancez :

```bash
npm run dev
```

5. Dans l’onglet **Ports**, ouvrez l’adresse du port **3000**, nommé **Project Starlight**. Le serveur écoute déjà sur `0.0.0.0` ; la configuration transfère ce port et affiche une notification lorsqu’il devient disponible. Le serveur reste à démarrer avec la commande ci-dessus à chaque nouvelle session.

Conservez la visibilité du port privée pour votre usage personnel. Pour Supabase, ajoutez l’adresse exacte du port transféré aux URL de redirection autorisées ; elle ressemble à `https://NOM-DU-CODESPACE-3000.app.github.dev`. Si cette adresse change, actualisez la configuration Supabase. [Documentation GitHub sur les ports](https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace).

Si vous conservez l’application dans un sous-dossier d’un dépôt existant, adaptez votre configuration Codespaces pour ouvrir et installer ce sous-dossier. La configuration fournie suppose que `package.json` et `.devcontainer` se trouvent à la racine du dépôt. [Configuration Node dans Codespaces](https://docs.github.com/en/codespaces/setting-up-your-project-for-codespaces/adding-a-dev-container-configuration/setting-up-your-nodejs-project-for-codespaces).

## Activer Supabase

### 1. Créer et préparer la base

1. Créez votre projet dans [Supabase](https://supabase.com/dashboard).
2. Dans **SQL Editor**, créez une nouvelle requête.
3. Copiez tout le contenu de `supabase/migrations/001_starlight.sql`, puis exécutez-le.
4. Vérifiez la présence de la table `public.app_workspaces` et de la fonction `public.save_workspace`.

La migration active la sécurité au niveau des lignes (**RLS**) et limite les accès au propriétaire de l’espace. Elle doit s’exécuter intégralement avant la première connexion de l’application. `supabase/seed.sql` explique l’initialisation ; il ne crée aucun utilisateur et n’écrit aucune donnée dans le compte d’un tiers.

### 2. Configurer les variables publiques

Copiez `.env.example` vers `.env.local`.

Sur macOS/Linux ou dans Codespaces :

```bash
cp .env.example .env.local
```

Sur Windows PowerShell :

```powershell
Copy-Item .env.example .env.local
```

Dans les paramètres de connexion/API de votre projet Supabase, récupérez l’URL du projet et sa **clé publishable**, puis renseignez :

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=VOTRE_CLE_PUBLISHABLE
```

Si votre projet utilise encore une clé publique historique `anon`, renseignez `NEXT_PUBLIC_SUPABASE_ANON_KEY` à la place de la clé publishable. Laissez l’autre champ vide. **N’utilisez jamais de clé `service_role` ou de clé secrète dans ces variables** : les variables `NEXT_PUBLIC_*` sont intégrées au code livré au navigateur. La protection des données dépend de Supabase Auth et des règles RLS, pas du secret de la clé publique.

Redémarrez `npm run dev` après toute modification de `.env.local`. Ce fichier est ignoré par Git. Aucun identifiant Supabase réel n’est livré avec ce projet.

### 3. Configurer l’authentification

1. Dans Supabase, ouvrez **Authentication → Providers / Sign In** et activez la connexion par e-mail et mot de passe.
2. Dans **Authentication → URL Configuration**, utilisez `http://localhost:3000` comme **Site URL** pendant le développement, puis votre adresse Vercel définitive en production.
3. Ajoutez aux **Redirect URLs** les origines utilisées, par exemple `http://localhost:3000/**`, l’adresse de votre Codespace et celle de votre application Vercel. Préférez les adresses de production précises aux autorisations trop larges.
4. Si la confirmation d’e-mail est activée, ouvrez le message reçu après l’inscription et confirmez votre adresse avant de vous connecter. Pour un service public, configurez également votre fournisseur d’envoi SMTP et les limites adaptées dans Supabase.
5. Dans l’application, ouvrez **Settings** puis la section de compte : créez votre compte ou connectez-vous avec votre e-mail et votre mot de passe.

Le client utilise Supabase Auth dans le navigateur. Il ne s’agit pas d’une implémentation d’authentification SSR avec cookies serveur ou middleware. Les liens de confirmation reviennent sur l’application ; aucun fournisseur OAuth n’est configuré par défaut. [Authentification par mot de passe](https://supabase.com/docs/guides/auth/passwords), [configuration des URL de redirection](https://supabase.com/docs/guides/auth/redirect-urls).

### 4. Comprendre l’enregistrement

Chaque utilisateur possède une ligne dans `app_workspaces` :

| Colonne | Rôle |
| --- | --- |
| `user_id` | Identifiant Supabase Auth, clé primaire ; la ligne est supprimée si le compte Auth est supprimé. |
| `data` | Instantané JSON de version 1 : tâches, événements, matières, sessions, notes, objectifs, ressources et paramètres. |
| `revision` | Numéro croissant utilisé pour détecter les écritures concurrentes. |
| `updated_at` | Date de la dernière sauvegarde effectuée par la fonction. |

À la connexion, l’application charge la ligne du compte. Un compte sans espace reçoit les données de démonstration de `createDemoData()`. Les sauvegardes passent par `save_workspace(p_data, p_expected_revision)` : révision attendue `0` pour une création, puis numéro de la dernière révision chargée pour les mises à jour.

Si un autre onglet ou appareil enregistre entre-temps, la fonction refuse une écriture basée sur une ancienne révision avec le code `40001`. **Rechargez l’espace avant de poursuivre** ; il n’y a pas de fusion automatique des modifications concurrentes. Conservez séparément une copie de toute modification non sauvegardée que vous souhaitez réappliquer.

Le schéma **SQL** vérifie la structure générale du JSON, la présence des tableaux et des paramètres, ainsi que le numéro de version. Il ne valide pas chaque champ métier en profondeur. Le validateur de l’application effectue les contrôles détaillés des données importées et chargées depuis le cloud avant de les afficher ; ces contrôles dans le navigateur ne remplacent pas les règles de la base pour un client qui appelle directement l’API. Ce choix rend l’installation simple pour un espace personnel ; ce n’est pas un schéma relationnel conçu pour la BI, les grandes équipes ou la collaboration simultanée. Les permissions RLS protègent les lignes entre comptes ; la concurrence optimiste concerne les écritures passant par la fonction fournie.

Le mode démonstration reste un stockage local de navigateur : il n’offre ni séparation sécurisée entre personnes partageant le même profil de navigateur, ni chiffrement applicatif. La synchronisation Supabase nécessite une connexion réseau ; le projet ne met pas en place de file de synchronisation hors ligne ni de service worker.

## Publier sur Vercel

1. Placez le projet dans votre dépôt GitHub et poussez les fichiers, y compris `package-lock.json`.
2. Dans [Vercel](https://vercel.com/new), choisissez **Add New → Project**, puis importez ce dépôt.
3. Vérifiez **Framework Preset : Next.js**.
4. Si `package.json` est à la racine du dépôt, laissez **Root Directory** à la racine. Si vous avez conservé un dossier parent, sélectionnez précisément le sous-dossier `project-starlight` contenant `package.json`.
5. Utilisez Node **22.x** ou une version compatible supérieure dans les paramètres du projet. La configuration fournie utilise `npm ci` pour l’installation et `npm run build` pour la compilation. Laissez la sortie Next.js automatique.
6. Pour activer les comptes, ajoutez `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` aux environnements voulus (**Production**, et **Preview** si vous en avez besoin). La variable `NEXT_PUBLIC_SUPABASE_ANON_KEY` sert uniquement d’alternative historique. Renseignez ces valeurs dans les paramètres Vercel : `vercel.json` contient seulement le framework et les commandes, aucun identifiant. N’y ajoutez aucune clé secrète.
7. Cliquez sur **Deploy**.
8. Une fois l’URL connue, ajoutez-la aux URL autorisées de Supabase et utilisez l’URL de production comme **Site URL**.
9. Testez l’inscription, la confirmation d’e-mail, la connexion, la modification d’une tâche et le rechargement de la page sur le domaine final.

Vercel détecte Next.js et fournit ses réglages de compilation. [Documentation Next.js sur Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs).

Si vous modifiez une variable publique après un déploiement, **relancez un déploiement** : sa valeur fait partie du code compilé. Le bouton **Redeploy** se trouve dans les actions du déploiement. Sans variables Supabase, le site fonctionne en démonstration locale. [Variables d’environnement Vercel](https://vercel.com/docs/environment-variables/managing-environment-variables).

La livraison des fichiers ne constitue pas un déploiement cloud. Il faut disposer de vos comptes GitHub, Supabase et Vercel et effectuer les étapes ci-dessus pour obtenir une URL publique reliée à votre base.

## Vérifications

```bash
npm test
npm run typecheck
npm run build
```

Les tests unitaires couvrent notamment la moyenne pondérée, les limites de maîtrise, la planification de révision aux changements de date, le filtrage des protocoles d’URL et la validation des sauvegardes.

Pour les tests de navigateur, installez d’abord Chromium pour Playwright :

```bash
npx playwright install chromium
npm run test:e2e
```

Sur un conteneur Linux ne disposant pas des bibliothèques système requises, utilisez `npx playwright install --with-deps chromium`. La configuration Playwright démarre `npm run dev` sur le port 3000, ou réutilise un serveur déjà présent. Sur Windows, elle utilise Microsoft Edge s’il est installé ; ailleurs, elle utilise Chromium, sauf si vous précisez `PLAYWRIGHT_CHANNEL`. Ces commandes décrivent comment effectuer les vérifications ; elles ne prétendent pas que votre configuration Supabase ou votre déploiement distant ont été testés.

Avant de partager votre installation, vérifiez au minimum : déplacement Inbox → quadrant, déplacement au clavier, création d’un créneau, démarrage/pause d’une session, changement de page avec Cmd/Ctrl+K, affichage mobile, persistance au rechargement et isolation entre deux comptes Supabase distincts. Le test d’isolation requiert deux vrais comptes dans votre projet.

## Organisation technique

```text
app/                         Entrée Next.js, mise en page et styles
components/                  Interface et vues interactives
lib/                         Types, données, état et utilitaires
public/starlight-world.png    Décor généré pour ce projet
supabase/migrations/          Schéma, RLS et fonction de sauvegarde
supabase/seed.sql             Explication de l’initialisation par compte
tests/                       Vérifications automatisées
.devcontainer/               Environnement Codespaces
.env.example                 Variables à renseigner localement
vercel.json                  Configuration de déploiement
```

Stack : **Next.js 16, React 19, TypeScript**, styles CSS et composants maison, **dnd-kit** pour les déplacements, icônes **Lucide**, dialogues **Radix UI**, et client **Supabase JS**. Aucun compte payant, clé secrète ou service distant préconfiguré n’est nécessaire pour essayer la version locale.

Le décor `public/starlight-world.png` a été généré pour cette application à partir de l’ambiance de la référence ; il est fourni avec le projet. Le rendu vise une forte proximité visuelle, mais une fidélité de « 99 % » n’est pas mesurable ni certifiée. Les espacements s’adaptent à la largeur de l’écran et le rendu du verre varie légèrement selon le navigateur. Le contenu et les composants restent de véritables éléments interactifs.

## Dépannage

| Symptôme | Vérification |
| --- | --- |
| `npm ci` échoue | Vérifiez Node 22+, l’accès au registre npm et la présence du fichier de verrouillage fourni. |
| Le port 3000 est déjà utilisé | Arrêtez l’autre serveur, ou lancez `npm run dev -- --port 3001` et adaptez l’URL. |
| La connexion Supabase reste indisponible | Vérifiez `.env.local`, le préfixe exact des variables et le redémarrage/rebuild du serveur. |
| La table ou la fonction est introuvable | Exécutez toute la migration dans le même projet Supabase que l’URL configurée. |
| L’e-mail de confirmation n’arrive pas | Vérifiez l’adresse, les indésirables, les limites d’envoi et la configuration SMTP dans Supabase. |
| Le lien de confirmation ouvre une mauvaise adresse | Corrigez Site URL et Redirect URLs dans Supabase. |
| Une sauvegarde indique un conflit de révision | Rechargez les données les plus récentes avant de réappliquer vos changements. |
| Les données démo ont disparu | Vérifiez le domaine, le profil de navigateur et si le stockage du site a été effacé ou bloqué. |
| Les changements d’environnement ne sont pas visibles sur Vercel | Lancez un nouveau déploiement après modification des variables. |

Les intégrations de calendriers externes, les notifications push, la collaboration multi-utilisateur et un stockage de pièces jointes Supabase Storage ne sont pas configurés dans cette livraison. Les liens de ressources sont des URL HTTP(S), sans exécution de contenu fourni par l’utilisateur.
