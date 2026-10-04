-- Slice 5: directional telemetry for 2–20 users. Review/apply manually.
begin;

create table public.experiment_events (
  id bigint generated always as identity primary key,
  user_id text not null default (auth.jwt()->>'sub') references public.application_accounts(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  event_name text not null,
  source text,
  task_count integer,
  stage text,
  addition_request_id uuid,
  unique (user_id, event_name, addition_request_id),
  constraint experiment_event_contract check (coalesce(case
    when event_name = 'task_added' then
      source in ('manual', 'capture') and task_count between 1 and 20 and stage is null and addition_request_id is not null
    when event_name = 'capture_succeeded' then
      source is null and task_count between 1 and 20 and stage is null and addition_request_id is not null
    when event_name = 'capture_failed' then
      source is null and task_count is null and stage in ('interpretation', 'persistence') and addition_request_id is null
    when event_name in ('capture_submitted', 'capture_clarification_requested', 'context_interacted',
      'recommendation_surfaced', 'task_edited', 'task_deleted') then
      source is null and task_count is null and stage is null and addition_request_id is null
    else false end, false))
);

alter table public.experiment_events enable row level security;
create policy experiment_events_insert_own on public.experiment_events
  for insert to authenticated with check (user_id = (select auth.jwt()->>'sub'));

revoke all on public.experiment_events from public, anon, authenticated;
grant insert (event_name, source, task_count, stage, addition_request_id) on public.experiment_events to authenticated;
revoke all on sequence public.experiment_events_id_seq from public, anon, authenticated;
grant usage on sequence public.experiment_events_id_seq to authenticated;

commit;
