-- Après création et confirmation du nouveau compte, remplacer UNIQUEMENT
-- l'adresse ci-dessous, puis exécuter dans Supabase > SQL Editor.
-- Aucun mot de passe ne doit être placé dans ce fichier.
begin;
lock table public.apm_admins in exclusive mode;
do $$
declare
 new_email text := 'REMPLACER_PAR_LE_NOUVEL_EMAIL';
 new_id uuid;
 new_login text;
 confirmed timestamptz;
begin
 select id, raw_user_meta_data->>'username', email_confirmed_at
 into new_id, new_login, confirmed
 from auth.users where lower(email)=lower(trim(new_email));
 if new_id is null then raise exception 'Nouveau compte introuvable. Aucun changement effectué.'; end if;
 if confirmed is null then raise exception 'Confirmez le nouvel e-mail avant le remplacement.'; end if;
 if coalesce(new_login,'') !~ '^[a-z0-9_.-]{3,40}$' then
  raise exception 'Le nouveau compte doit avoir un login valide dans ses métadonnées username.';
 end if;
 -- L'ancien compte perd immédiatement ses droits sur le catalogue,
 -- y compris avec une session encore ouverte.
 delete from public.apm_admins;
 insert into public.apm_admins(user_id) values(new_id);
end;
$$;
-- Garantit au maximum un administrateur, même lors d'une insertion ultérieure.
create unique index if not exists apm_single_admin on public.apm_admins ((true));
commit;
select a.user_id, u.email, u.raw_user_meta_data->>'username' as login
from public.apm_admins a join auth.users u on u.id=a.user_id;
