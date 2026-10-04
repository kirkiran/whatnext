-- Apply Slice 5 first; run as project owner in development SQL Editor.
-- Synthetic subjects/claims only. All test data and grants are rolled back.
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"user_rur_events_A","role":"authenticated"}', true);
insert into public.application_accounts (user_id) values ('user_rur_events_A') on conflict do nothing;
insert into public.experiment_events (event_name) values ('capture_submitted');
insert into public.experiment_events (event_name, source, task_count, addition_request_id)
values ('task_added', 'capture', 2, '01a10267-75c2-4470-b88e-0d2d1e8f8611');
insert into public.experiment_events (event_name, task_count, addition_request_id)
values ('capture_succeeded', 2, '01a10267-75c2-4470-b88e-0d2d1e8f8611');
do $$
begin
  begin
    insert into public.experiment_events (event_name, source, task_count, addition_request_id)
    values ('task_added', 'capture', 2, '01a10267-75c2-4470-b88e-0d2d1e8f8611');
    raise exception 'FAIL: duplicate addition allowed';
  exception when unique_violation then null; end;
  begin
    insert into public.experiment_events (event_name, stage) values ('context_interacted', 'interpretation');
    raise exception 'FAIL: extra metadata allowed';
  exception when check_violation then null; end;
  begin
    insert into public.experiment_events (event_name) values ('capture_failed');
    raise exception 'FAIL: missing stage allowed';
  exception when check_violation then null; end;
  begin
    insert into public.experiment_events (event_name) values ('page_view');
    raise exception 'FAIL: unknown event allowed';
  exception when check_violation then null; end;
  begin
    insert into public.experiment_events (event_name, task_count, addition_request_id)
    values ('capture_succeeded', 21, '01a10267-75c2-4470-b88e-0d2d1e8f8612');
    raise exception 'FAIL: invalid count allowed';
  exception when check_violation then null; end;
  begin
    insert into public.experiment_events (user_id, event_name) values ('user_rur_events_B', 'context_interacted');
    raise exception 'FAIL: caller owner accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.experiment_events (created_at, event_name) values ('2000-01-01', 'context_interacted');
    raise exception 'FAIL: caller timestamp accepted';
  exception when insufficient_privilege then null; end;
  begin
    perform 1 from public.experiment_events;
    raise exception 'FAIL: authenticated SELECT allowed';
  exception when insufficient_privilege then null; end;
  begin
    update public.experiment_events set stage = null;
    raise exception 'FAIL: authenticated UPDATE allowed';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.experiment_events;
    raise exception 'FAIL: authenticated DELETE allowed';
  exception when insufficient_privilege then null; end;
end;
$$;
reset role;
do $$
begin
  if (select count(*) from public.experiment_events where user_id = 'user_rur_events_A') <> 3
    or exists (select 1 from public.experiment_events where user_id = 'user_rur_events_A' and created_at is null) then
    raise exception 'FAIL: event identity/defaults/deduplication';
  end if;
end;
$$;

-- A temporary owner-column grant tests RLS separately from column permissions.
grant insert (user_id) on public.experiment_events to authenticated;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"user_rur_events_B","role":"authenticated"}', true);
do $$
begin
  begin
    insert into public.experiment_events (user_id, event_name) values ('user_rur_events_A', 'context_interacted');
    raise exception 'FAIL: cross-user RLS bypass';
  exception when insufficient_privilege then null; end;
end;
$$;
reset role;
revoke insert (user_id) on public.experiment_events from authenticated;
set local role anon;
select set_config('request.jwt.claims', '{}', true);
do $$
begin
  begin
    insert into public.experiment_events (event_name) values ('capture_submitted');
    raise exception 'FAIL: anonymous INSERT allowed';
  exception when insufficient_privilege then null; end;
end;
$$;
reset role;

-- Only the SQL owner can supply these historical timestamps.
insert into public.application_accounts (user_id) values ('user_rur_return_A'), ('user_rur_return_B');
insert into public.experiment_events (user_id, created_at, event_name) values
 ('user_rur_return_A', '2026-10-03 23:30:00+00', 'context_interacted'),
 ('user_rur_return_A', '2026-10-04 00:30:00+00', 'task_edited'),
 ('user_rur_return_B', '2026-10-03 12:00:00+00', 'recommendation_surfaced'),
 ('user_rur_return_B', '2026-10-04 12:00:00+00', 'recommendation_surfaced');
set local timezone = 'America/New_York';
do $$
declare returned text[];
begin
  select array_agg(user_id) into returned from (
    select user_id from public.experiment_events
    where user_id in ('user_rur_return_A', 'user_rur_return_B')
      and event_name in ('task_added', 'capture_submitted', 'context_interacted', 'task_edited', 'task_deleted')
    group by user_id having count(distinct (created_at at time zone 'UTC')::date) > 1
  ) as qualifying;
  if returned is distinct from array['user_rur_return_A'] then raise exception 'FAIL: UTC return definition'; end if;
end;
$$;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"user_rur_events_A","role":"authenticated"}', true);
delete from public.application_accounts where user_id = 'user_rur_events_A';
reset role;
do $$
begin
  if exists (select 1 from public.experiment_events where user_id = 'user_rur_events_A') then
    raise exception 'FAIL: event cascade incomplete';
  end if;
end;
$$;
rollback;
