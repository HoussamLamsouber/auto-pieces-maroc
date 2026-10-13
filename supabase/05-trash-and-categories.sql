-- Exécuter une fois dans Supabase > SQL Editor avant de publier le site.
begin;
grant delete on public.products to authenticated;
drop policy if exists apm_admin_delete_trash on public.products;
create policy apm_admin_delete_trash on public.products
for delete to authenticated
using (efface = 'Oui' and exists (
 select 1 from public.apm_admins where user_id = (select auth.uid())
));

create or replace function public.apm_validate_category()
returns trigger language plpgsql set search_path = '' as $$
begin
 if TG_OP = 'UPDATE' then
  if new.category is not distinct from old.category then return new; end if;
 end if;
 if new.category is null or new.category not in
 ('Refroidissement','Moteur','Transmission','Distribution') then
  raise exception 'Choisissez une catégorie de la liste.' using errcode = '23514';
 end if;
 return new;
end;
$$;
drop trigger if exists apm_validate_category on public.products;
create trigger apm_validate_category before insert or update on public.products
for each row execute function public.apm_validate_category();
commit;
-- Les anciennes catégories ne sont pas modifiées automatiquement.
-- À la prochaine édition d'une fiche, choisir une catégorie autorisée.
-- Les fichiers photo restent conservés : plusieurs fiches peuvent les partager.
