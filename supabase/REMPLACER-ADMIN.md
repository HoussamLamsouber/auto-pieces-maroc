# Administrateur unique

Les comptes sont gérés manuellement dans Supabase Authentication > Users. La page du site propose uniquement la connexion par e-mail et mot de passe.
Le login affiché provient de la métadonnée utilisateur username ; sans cette valeur, le site affiche Administrateur.
La table apm_admins doit contenir uniquement l'UID du compte autorisé. Le script 04-replace-admin.sql permet de remplacer ces droits après vérification du nouveau compte.
Désactiver les inscriptions publiques dans la configuration Supabase Auth. Retirer le formulaire du site ne désactive pas à lui seul l'API d'inscription Supabase.

# Corbeille et catégories

Exécuter 05-trash-and-categories.sql dans SQL Editor avant de publier cette version.
La suppression définitive efface uniquement une fiche déjà dans la corbeille. Les photos sont conservées pour ne pas casser les autres fiches qui les utilisent.
Les catégories autorisées sont Refroidissement, Moteur, Transmission et Distribution. Les anciennes valeurs libres restent conservées ; choisir une catégorie autorisée à la prochaine édition de la fiche.
