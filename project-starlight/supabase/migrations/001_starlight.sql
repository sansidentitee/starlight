-- Project Starlight: one private versioned workspace per authenticated user.
-- Run this entire migration in the SQL Editor of your own Supabase project.
begin;

create table if not exists public.app_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  revision integer not null default 1 check (revision >= 1),
  updated_at timestamptz not null default now(),
  constraint starlight_workspace_shape check (coalesce(
    jsonb_typeof(data) = 'object'
    and data -> 'version' = '1'::jsonb
    and jsonb_typeof(data -> 'settings') = 'object'
    and jsonb_typeof(data -> 'tasks') = 'array'
    and jsonb_typeof(data -> 'events') = 'array'
    and jsonb_typeof(data -> 'subjects') = 'array'
    and jsonb_typeof(data -> 'sessions') = 'array'
    and jsonb_typeof(data -> 'grades') = 'array'
    and jsonb_typeof(data -> 'goals') = 'array'
    and jsonb_typeof(data -> 'notes') = 'array'
    and jsonb_typeof(data -> 'resources') = 'array'
    and jsonb_typeof(data -> 'reviews') = 'array', false
  ))
);

comment on table public.app_workspaces is
  'Private app snapshot. RLS isolates users; save_workspace adds optimistic concurrency.';

alter table public.app_workspaces enable row level security;

drop policy if exists "starlight_select_own" on public.app_workspaces;
create policy "starlight_select_own" on public.app_workspaces
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "starlight_insert_own" on public.app_workspaces;
create policy "starlight_insert_own" on public.app_workspaces
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "starlight_update_own" on public.app_workspaces;
create policy "starlight_update_own" on public.app_workspaces
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "starlight_delete_own" on public.app_workspaces;
create policy "starlight_delete_own" on public.app_workspaces
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on table public.app_workspaces from public, anon;
grant select, insert, update, delete on table public.app_workspaces to authenticated;

create or replace function public.save_workspace(
  p_data jsonb,
  p_expected_revision integer
) returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_next_revision integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if p_expected_revision is null or p_expected_revision < 0 then
    raise exception 'Expected revision must be a non-negative integer.'
      using errcode = '22023';
  end if;

  -- The table CHECK also validates direct writes. The snapshot contents remain
  -- application data, not executable SQL, and are not deeply relationally validated.
  if p_expected_revision = 0 then
    begin
      insert into public.app_workspaces (user_id, data, revision, updated_at)
        values (v_user_id, p_data, 1, now())
        returning revision into v_next_revision;
    exception when unique_violation then
      raise exception 'Workspace revision conflict. Reload before saving again.'
        using errcode = '40001';
    end;
  else
    update public.app_workspaces
      set data = p_data,
          revision = revision + 1,
          updated_at = now()
      where user_id = v_user_id and revision = p_expected_revision
      returning revision into v_next_revision;

    if not found then
      raise exception 'Workspace revision conflict. Reload before saving again.'
        using errcode = '40001';
    end if;
  end if;

  return v_next_revision;
end;
$$;

comment on function public.save_workspace(jsonb, integer) is
  'Writes only auth.uid() workspace. Expected revision 0 creates; stale revisions fail with SQLSTATE 40001.';

revoke all on function public.save_workspace(jsonb, integer) from public, anon;
grant execute on function public.save_workspace(jsonb, integer) to authenticated;

commit;
