-- Run as project owner in SQL Editor, not through the application.
-- Deleted accounts/events are absent; invitation counts remain manual.
select count(distinct user_id) as users_with_durable_intentions
from public.experiment_events where event_name = 'task_added';

select source, count(*) as addition_batches, sum(task_count) as intentions,
  count(distinct user_id) as users
from public.experiment_events where event_name = 'task_added' group by source;

select event_name, stage, count(*) as events, count(distinct user_id) as users,
  sum(task_count) as captured_intentions
from public.experiment_events
where event_name in ('capture_submitted', 'capture_succeeded', 'capture_clarification_requested', 'capture_failed')
group by event_name, stage order by event_name, stage;

select event_name, count(*) as events, count(distinct user_id) as users
from public.experiment_events where event_name in ('context_interacted', 'recommendation_surfaced')
group by event_name;

-- More than one qualifying UTC date means activity later than the first date.
-- Recommendation exposure alone never qualifies. No returned event is stored.
select user_id, min((created_at at time zone 'UTC')::date) as first_qualifying_day,
  max((created_at at time zone 'UTC')::date) as last_qualifying_day,
  count(distinct (created_at at time zone 'UTC')::date) as qualifying_days
from public.experiment_events
where event_name in ('task_added', 'capture_submitted', 'context_interacted', 'task_edited', 'task_deleted')
group by user_id
having count(distinct (created_at at time zone 'UTC')::date) > 1;
