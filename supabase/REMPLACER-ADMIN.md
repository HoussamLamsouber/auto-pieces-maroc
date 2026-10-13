# Remplacer l'administrateur en ligne

1. Publier les modifications sur GitHub et attendre le déploiement Vercel.
2. Sur `/admin`, choisir **Créer un compte**. Saisir le login à afficher, une nouvelle adresse e-mail et un mot de passe d'au moins 12 caractères. Le login est enregistré en minuscules. Utiliser une adresse différente de celle de l'ancien compte.
3. Confirmer l'adresse via le message reçu de Supabase. Le compte créé n'a encore aucun droit sur les pièces. Si l'inscription est désactivée dans Supabase Auth, l'activer temporairement pour cette création.
4. Ouvrir `04-replace-admin.sql`, remplacer `REMPLACER_PAR_LE_NOUVEL_EMAIL` par cette adresse et exécuter le script dans Supabase SQL Editor. Le script vérifie le compte et son login avant de remplacer les droits. Une erreur annule la transaction entière. La dernière requête doit afficher un seul administrateur.
5. Se connecter à `/admin` avec le nouvel e-mail et le mot de passe ; vérifier le login affiché et l'accès au catalogue.
6. Dans Supabase Authentication > Users, supprimer l'ancien utilisateur `61cc6833-b711-4a66-a59d-b31c194bc454`, après avoir vérifié son adresse. Ses droits sur les pièces ont déjà été retirés par le script. Ne pas supprimer le nouvel utilisateur. Supabase peut refuser la suppression si l'ancien compte possède des objets Storage : dans ce cas conserver ce compte sans droits, sans supprimer les photos des produits.
7. Désactiver les nouvelles inscriptions dans Supabase Auth puisque le site n'a qu'un seul administrateur.

Le mot de passe se saisit uniquement dans le formulaire. Aucune clé secrète Vercel supplémentaire n'est nécessaire. Le compte SQLite local reste indépendant.

Le fichier expérimental `04-account-logins.sql` de l'étape interrompue n'est plus nécessaire ; ne pas l'exécuter.
