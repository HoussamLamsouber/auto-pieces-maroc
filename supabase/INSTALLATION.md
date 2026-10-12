# Préparation Supabase — connexion pas encore activée

Le site et le serveur local restent inchangés tant que la connexion Supabase n'est pas configurée et vérifiée.

1. Exécuter 01-schema.sql dans le SQL Editor du projet Supabase. Les politiques réservent les modifications aux comptes explicitement autorisés. Un compte simplement connecté ne peut pas administrer le catalogue.
2. Dans Authentication / Users, créer le compte administrateur par e-mail. Choisir le mot de passe dans Supabase, sans l'enregistrer dans Git ni le transmettre dans le chat.
3. Copier l'UUID de ce compte et exécuter dans le SQL Editor, en remplaçant le texte indiqué :

   `insert into public.apm_admins(user_id) values ('UUID_DU_COMPTE_ADMIN') on conflict do nothing;`

4. Fournir à l'intégration uniquement l'URL du projet et sa clé publishable (ou anon). Ne jamais exposer de clé secret ou service_role dans le navigateur. La clé publique seule ne donne aucun droit d'administration.
5. L'adaptation du site, le transfert du catalogue et des photos, et les vérifications de droits doivent encore être réalisés avant de basculer Vercel. Ne pas importer les anciens mots de passe ou les sessions SQLite.

Le schéma conserve efface = Oui/Non et date_suppression. Restaurer une pièce la masque par défaut et conserve la date de sa dernière suppression. Les photos du bucket sont accessibles publiquement ; les fiches masquées ou supprimées ne le sont pas. Avant publication, tester l'accès anonyme, un utilisateur non administrateur et l'administrateur.

Ce script est préparé localement ; il n'a pas encore été exécuté ni validé sur votre projet Supabase. Il suppose un nouveau projet sans table products existante. Pour une table préexistante, vérifier et adapter sa structure avant exécution.
