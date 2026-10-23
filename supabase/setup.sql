-- First create your user in Supabase Authentication > Users.
-- Replace the UUID below with that user's actual ID, then run this entire file.
begin;
create table if not exists public.kitchen_owner (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.kitchen_owner enable row level security;
revoke all on public.kitchen_owner from anon, authenticated;
grant select on public.kitchen_owner to authenticated;
create policy owner_can_read_self on public.kitchen_owner for select to authenticated
  using ((select auth.uid()) = user_id);

insert into public.kitchen_owner(user_id) values ('REPLACE_WITH_YOUR_USER_UUID');

create table public.kitchen_data (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  version integer not null default 0
);
alter table public.kitchen_data enable row level security;
revoke all on public.kitchen_data from anon, authenticated;
grant select, update on public.kitchen_data to authenticated;
create policy private_kitchen_read on public.kitchen_data for select to authenticated
  using ((select auth.uid()) = owner_id and exists (
    select 1 from public.kitchen_owner where user_id = (select auth.uid())
  ));
create policy private_kitchen_update on public.kitchen_data for update to authenticated
  using ((select auth.uid()) = owner_id and exists (
    select 1 from public.kitchen_owner where user_id = (select auth.uid())
  ))
  with check ((select auth.uid()) = owner_id and exists (
    select 1 from public.kitchen_owner where user_id = (select auth.uid())
  ));
insert into public.kitchen_data(owner_id,data)
select user_id, '{"inventory":[],"meals":[],"plan":[],"preferences":[{"name":"Me","diet":"","avoid":"","notes":""},{"name":"Husband","diet":"","avoid":"","notes":""}],"checks":[],"notifyDays":3}'::jsonb
from public.kitchen_owner;
commit;
