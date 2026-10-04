-- Slice 2: review before applying. Native Clerk JWTs; no auth.users dependency.
begin;

create table public.application_accounts (
  user_id text primary key default (auth.jwt()->>'sub'),
  created_at timestamptz not null default now(),
  constraint application_account_subject check (length(user_id) > 0)
);

create table public.tasks (
  id bigint generated always as identity (maxvalue 9007199254740991) primary key,
  user_id text not null default (auth.jwt()->>'sub') references public.application_accounts(user_id) on delete cascade,
  addition_request_id uuid not null,
  batch_position smallint not null check (batch_position >= 0 and batch_position < 20),
  created_at timestamptz not null default now(),
  name text not null check (length(btrim(name)) > 0 and char_length(name) <= 500),
  duration double precision not null check (duration > 0 and duration < 'Infinity'::double precision),
  urgency text not null check (urgency in ('low', 'medium', 'high')),
  importance text not null check (importance in ('low', 'medium', 'high')),
  focus_required text not null check (focus_required in ('low', 'medium', 'high')),
  context_tag text not null check (context_tag in ('flexible', 'desk', 'home', 'outside')),
  readiness text not null check (readiness in ('ready', 'blocked')),
  can_be_done_in_parts text not null check (can_be_done_in_parts in ('yes', 'no')),
  original_capture text check (original_capture is null or (length(btrim(original_capture)) > 0 and char_length(original_capture) <= 4000)),
  unique (user_id, addition_request_id, batch_position)
);

alter table public.application_accounts enable row level security;
alter table public.tasks enable row level security;

create policy accounts_select_own on public.application_accounts for select to authenticated
  using (user_id = (select auth.jwt()->>'sub'));
create policy accounts_insert_own on public.application_accounts for insert to authenticated
  with check (user_id = (select auth.jwt()->>'sub'));

create policy tasks_select_own on public.tasks for select to authenticated
  using (user_id = (select auth.jwt()->>'sub'));
create policy tasks_insert_own on public.tasks for insert to authenticated
  with check (user_id = (select auth.jwt()->>'sub'));
create policy tasks_update_own on public.tasks for update to authenticated
  using (user_id = (select auth.jwt()->>'sub'))
  with check (user_id = (select auth.jwt()->>'sub'));
create policy tasks_delete_own on public.tasks for delete to authenticated
  using (user_id = (select auth.jwt()->>'sub'));

-- Explicit grants: this project disables automatic table exposure.
-- Immutable owner, ID, addition provenance and capture source cannot be updated.
revoke all on public.application_accounts, public.tasks from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select on public.application_accounts to authenticated;
grant insert (user_id) on public.application_accounts to authenticated;
grant select, delete on public.tasks to authenticated;
grant insert (addition_request_id, batch_position, name, duration, urgency, importance,
  focus_required, context_tag, readiness, can_be_done_in_parts, original_capture) on public.tasks to authenticated;
grant update (name, duration, urgency, importance, focus_required, context_tag, readiness, can_be_done_in_parts)
  on public.tasks to authenticated;
revoke all on sequence public.tasks_id_seq from public, anon, authenticated;
grant usage on sequence public.tasks_id_seq to authenticated;

create function public.add_task_batch(p_request_id uuid, p_tasks jsonb, p_original_capture text default null)
returns setof public.tasks
language plpgsql
security invoker
set search_path = ''
as $$
declare
  subject text := auth.jwt()->>'sub';
  item jsonb;
  existing_count integer;
begin
  if subject is null or subject = '' or p_request_id is null then
    raise exception 'Authentication and request ID required' using errcode = '22023';
  end if;
  if jsonb_typeof(p_tasks) is distinct from 'array' then
    raise exception 'Invalid task batch' using errcode = '22023';
  end if;
  if jsonb_array_length(p_tasks) not between 1 and 20 then
    raise exception 'Invalid task batch size' using errcode = '22023';
  end if;
  if p_original_capture is not null and (length(btrim(p_original_capture)) = 0 or char_length(p_original_capture) > 4000) then
    raise exception 'Invalid capture source' using errcode = '22023';
  end if;
  for item in select value from jsonb_array_elements(p_tasks) loop
    if jsonb_typeof(item) is distinct from 'object' then
      raise exception 'Invalid task' using errcode = '22023';
    end if;
    if not (item ?& array['name','duration','urgency','importance','focusRequired','contextTag','readiness','canBeDoneInParts'])
      or (select count(*) from jsonb_object_keys(item)) <> 8
      or jsonb_typeof(item->'duration') is distinct from 'number'
      or exists (select 1 from jsonb_each(item) field where field.key <> 'duration' and jsonb_typeof(field.value) <> 'string') then
      raise exception 'Invalid task fields' using errcode = '22023';
    end if;
  end loop;

  -- Normalize names exactly as the application validator does before comparison.
  select jsonb_agg(jsonb_set(value, '{name}', to_jsonb(btrim(value->>'name'))) order by ordinal)
    into p_tasks from jsonb_array_elements(p_tasks) with ordinality as input(value, ordinal);

  insert into public.application_accounts (user_id) values (subject) on conflict (user_id) do nothing;

  select count(*) into existing_count from public.tasks
    where user_id = subject and addition_request_id = p_request_id;
  if existing_count > 0 and existing_count <> jsonb_array_length(p_tasks) then
    raise exception 'Addition retry does not match retained batch' using errcode = '22023';
  end if;

  -- One statement/function transaction: any bad member rolls back the whole batch.
  insert into public.tasks (addition_request_id, batch_position, name, duration, urgency, importance,
    focus_required, context_tag, readiness, can_be_done_in_parts, original_capture)
    select p_request_id, (ordinal - 1)::smallint, value->>'name', (value->>'duration')::double precision,
      value->>'urgency', value->>'importance', value->>'focusRequired', value->>'contextTag',
      value->>'readiness', value->>'canBeDoneInParts', p_original_capture
    from jsonb_array_elements(p_tasks) with ordinality as input(value, ordinal)
    on conflict (user_id, addition_request_id, batch_position) do nothing;

  if (select count(*) from public.tasks where user_id = subject and addition_request_id = p_request_id) <> jsonb_array_length(p_tasks)
    or exists (
      select 1 from public.tasks task
      where task.user_id = subject and task.addition_request_id = p_request_id and (
        task.original_capture is distinct from p_original_capture or
        jsonb_build_object('name', task.name, 'duration', task.duration, 'urgency', task.urgency,
          'importance', task.importance, 'focusRequired', task.focus_required, 'contextTag', task.context_tag,
          'readiness', task.readiness, 'canBeDoneInParts', task.can_be_done_in_parts)
        is distinct from (p_tasks->task.batch_position::integer)
      )
    ) then
    raise exception 'Addition request ID reused with different data' using errcode = '22023';
  end if;

  return query select * from public.tasks where user_id = subject and addition_request_id = p_request_id order by batch_position;
end;
$$;

revoke all on function public.add_task_batch(uuid, jsonb, text) from public, anon, authenticated;
grant execute on function public.add_task_batch(uuid, jsonb, text) to authenticated;

commit;
