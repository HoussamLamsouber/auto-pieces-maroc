-- À exécuter dans le SQL Editor Supabase, après 01-schema.sql.
-- Seul ce compte reçoit le droit d'administrer le catalogue.
insert into public.apm_admins (user_id)
values ('61cc6833-b711-4a66-a59d-b31c194bc454')
on conflict (user_id) do nothing;

select user_id from public.apm_admins
where user_id = '61cc6833-b711-4a66-a59d-b31c194bc454';
