-- Run ONLY after reviewing/applying the migration to a development database.
-- Emulates verified JWT claims to test database enforcement; does not test Clerk signatures.
-- All synthetic data is rolled back. Execute as the SQL Editor's administrative role.
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"user_rur_test_A","role":"authenticated"}', true);

do $$
declare
  batch jsonb := '[{"name":"Synthetic A","duration":15.5,"urgency":"medium","importance":"high","focusRequired":"low","contextTag":"flexible","readiness":"ready","canBeDoneInParts":"yes"}]';
  request_id uuid := '01a10267-75c2-4470-b88e-0d2d1e8f8688';
  first_id bigint;
  retry_id bigint;
  affected integer;
begin
  select id into first_id from public.add_task_batch(request_id, batch, 'Synthetic source');
  select id into retry_id from public.add_task_batch(request_id, batch, 'Synthetic source');
  if first_id is distinct from retry_id or
    (select count(*) from public.tasks where addition_request_id = request_id) <> 1 then
    raise exception 'FAIL: retry duplicated addition';
  end if;
  begin
    perform public.add_task_batch(request_id, jsonb_set(batch, '{0,name}', '"Changed"'), 'Synthetic source');
    raise exception 'FAIL: changed retry accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.add_task_batch('01a10267-75c2-4470-b88e-0d2d1e8f8689',
      batch || jsonb_set(batch, '{0,urgency}', '"invalid"'), null);
    raise exception 'FAIL: invalid batch accepted';
  exception when check_violation then null;
  end;
  if exists (select 1 from public.tasks where addition_request_id = '01a10267-75c2-4470-b88e-0d2d1e8f8689') then
    raise exception 'FAIL: partial batch persisted';
  end if;

  perform set_config('request.jwt.claims', '{"sub":"user_rur_test_B","role":"authenticated"}', true);
  if exists (select 1 from public.tasks where id = first_id) or
    exists (select 1 from public.application_accounts where user_id = 'user_rur_test_A') then
    raise exception 'FAIL: cross-account read';
  end if;
  update public.tasks set name = 'Spoofed' where id = first_id;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FAIL: cross-account edit'; end if;
  delete from public.tasks where id = first_id;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FAIL: cross-account delete'; end if;
  begin
    insert into public.application_accounts(user_id) values ('user_rur_test_spoof');
    raise exception 'FAIL: account owner spoof';
  exception when insufficient_privilege then null;
  end;
  -- Same request UUID is valid for a different subject.
  select id into retry_id from public.add_task_batch(request_id, batch, null);
  if retry_id = first_id then raise exception 'FAIL: request not user-scoped'; end if;
  begin
    update public.tasks set user_id = 'user_rur_test_A' where id = retry_id;
    raise exception 'FAIL: owner reassignment';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.tasks(user_id, addition_request_id, batch_position, name, duration, urgency,
      importance, focus_required, context_tag, readiness, can_be_done_in_parts)
    values ('user_rur_test_A', '01a10267-75c2-4470-b88e-0d2d1e8f8680', 0, 'Spoof', 1,
      'low', 'low', 'low', 'flexible', 'ready', 'no');
    raise exception 'FAIL: task owner spoof';
  exception when insufficient_privilege then null;
  end;
  update public.tasks set name = 'Synthetic edited' where id = retry_id;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'FAIL: own edit denied'; end if;
  delete from public.tasks where id = retry_id;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'FAIL: own delete denied'; end if;
end;
$$;

select set_config('request.jwt.claims', '{}', true);
set local role anon;
do $$
begin
  begin
    perform 1 from public.tasks;
    raise exception 'FAIL: anonymous task access granted';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.add_task_batch('01a10267-75c2-4470-b88e-0d2d1e8f8688', '[]', null);
    raise exception 'FAIL: anonymous RPC granted';
  exception when insufficient_privilege then null;
  end;
end;
$$;
rollback;
