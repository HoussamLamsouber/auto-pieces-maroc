# Auto Pièces Maroc — Boutique et administration

## Démarrer

Node.js 22.13 ou plus récent est nécessaire (déjà installé sur ce PC). Double-cliquez sur LANCER.cmd. Il démarre le serveur local et ouvre l’administration. Au premier lancement, choisissez un identifiant et un mot de passe de 12 caractères minimum. Le code de création à usage unique est transmis automatiquement par le lanceur et supprimé après création du compte.

- Boutique : http://127.0.0.1:4174/
- Administration : http://127.0.0.1:4174/admin.html

Autre méthode : lancez `node server.cjs` depuis ce dossier. Au premier accès admin, copiez le code de `data/setup-key.txt` dans le champ demandé. Gardez ce code privé. Aucun compte ni mot de passe par défaut n’est créé.

L’ancien aperçu sur le port 4173 et le fichier HTML ouvert directement ne sont pas reliés à la base. Utilisez désormais le port 4174. Le fichier products.js reste une copie statique initiale ; il ne pilote plus le catalogue servi par le nouveau serveur.

## Gérer les pièces

Ajouter une pièce ou Modifier permet de gérer : nom, référence, catégorie, description, photo et visibilité. Les nouvelles pièces ont un prix et une disponibilité sur demande. Les valeurs existantes sont conservées lors des modifications. Décochez Visible pour retirer une pièce sans la supprimer. Importez une photo JPEG, PNG ou WebP (5 Mo maximum), La photo actuelle est conservée si aucune nouvelle photo n’est importée. Les photos importées restent conservées même si le formulaire est annulé, et peuvent être réutilisées.

Enregistrez puis actualisez la boutique. Les modifications simultanées sont détectées : en cas de conflit, annulez le formulaire, actualisez la liste et recommencez.

Les boutons WhatsApp contactent le +212 633 274 823. Le visiteur envoie lui-même le message prérempli. Aucun paiement en ligne n’est connecté.

## Données et sauvegarde

La base SQLite est data/catalogue.sqlite. Elle contient les produits, le compte admin (mot de passe haché avec sel) et les sessions. Les photos importées sont dans data/uploads. Les 24 pièces initiales sont importées une seule fois depuis seed.json. La disponibilité est initialement sur demande.

Pour sauvegarder, arrêtez le serveur puis copiez tout le dossier du projet, notamment data et dist/assets. Ne copiez pas seulement le fichier SQLite pendant le fonctionnement : SQLite peut encore utiliser ses fichiers WAL. Conservez vos sauvegardes dans un emplacement privé.

Le dossier data est exclu de Git et de l’archive de distribution du code. L’archive initialise une nouvelle base : elle n’est PAS une sauvegarde du catalogue modifié. Les identifiants ne sont pas inclus dans l’archive.

## Futur hébergement

Cette version est locale, pas encore publiée. Elle utilise un serveur Node.js et un disque persistant pour SQLite et les photos. Un hébergement purement statique ou un disque temporaire ne convient pas tel quel. Pour la mise en ligne : choisir un hébergement compatible, transférer les données de façon privée, installer HTTPS, configurer NODE_ENV=production, PUBLIC_ORIGIN=https://votre-domaine, HOST et PORT, puis vérifier les accès et organiser les sauvegardes. Les écritures d’une autre origine sont refusées ; les cookies sont Secure en production. Une revue du déploiement reste nécessaire avant exposition publique.

Un seul compte admin est prévu. La récupération du mot de passe par e-mail et plusieurs comptes ne sont pas encore implémentés. Le bouton Supprimer déplace la fiche dans la corbeille : efface = Oui et date_suppression en UTC. La corbeille permet de restaurer la fiche avec efface = Non et visibilité désactivée. La dernière date de suppression est conservée après restauration. Les fichiers photo sont conservés pour ne pas supprimer une image utilisée par une autre pièce.

Le dossier .openai provient d’une ancienne tentative de publication statique et ne configure pas ce serveur. Publier uniquement dist ne déploie pas l’administration.

## Aperçu client sur Vercel

vercel.json configure un aperçu statique construit par scripts/build-preview.cjs dans .vercel-preview. La configuration conserve les appels du catalogue via deux réécritures vers des fichiers JSON publics. Elle ne déploie pas le serveur SQLite.

Dans Vercel : Root Directory = racine du dépôt, Framework Preset = Other. Le fichier vercel.json fournit la commande de build et le répertoire de sortie. L’administration locale reste accessible via LANCER.cmd ; l’administration de l’aperçu affiche une explication.

Pour actualiser l’aperçu après modification des pièces dans l’admin locale :
1. Exécuter `node scripts/export-preview.cjs` dans le dossier du projet.
2. Ajouter les changements de preview à Git et les envoyer sur GitHub.
3. Laisser Vercel redéployer le commit.

Seules les pièces visibles et non supprimées sont exportées. Le dossier preview contient des données et photos destinées à être visibles par le client : ne pas y ajouter de secrets. La base, les comptes et les sessions restent exclus de Git. Le panier et les liens WhatsApp restent actifs et dirigent vers le véritable numéro du vendeur.
