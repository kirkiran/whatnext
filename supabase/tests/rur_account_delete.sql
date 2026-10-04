-- Review and apply the Slice 4 migration first. Run in the development SQL Editor.
-- JWT claims are synthetic: checks database enforcement, not Clerk signatures.
-- All synthetic rows are rolled back.
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"user_rur_delete_A","role":"authenticated"}', true);

do $$
declare
  batch jsonb := '[{"name":"Synthetic deletion task","duration":15,"urgency":"medium","importance":"medium","focusRequired":"low","contextTag":"flexible","readiness":"ready","canBeDoneInParts":"no"}]';
  affected integer;
begin
  perform public.add_task_batch('01a10267-75c2-4470-b88e-0d2d1e8f8601', batch, 'Synthetic original Capture text');
  perform set_config('request.jwt.claims', '{"sub":"user_rur_delete_B","role":"authenticated"}', true);
  perform public.add_task_batch('01a10267-75c2-4470-b88e-0d2d1e8f8602', batch, null);

  delete from public.application_accounts where user_id = 'user_rur_delete_A';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FAIL: cross-account root deletion allowed'; end if;

  perform set_config('request.jwt.claims', '{"sub":"user_rur_delete_A","role":"authenticated"}', true);
  if not exists (select 1 from public.tasks where original_capture = 'Synthetic original Capture text') then
    raise exception 'FAIL: cross-account attempt removed A tasks';
  end if;
  delete from public.application_accounts where user_id = 'user_rur_delete_A';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'FAIL: own-root deletion denied'; end if;
  if exists (select 1 from public.application_accounts) or exists (select 1 from public.tasks) then
    raise exception 'FAIL: account/task cascade incomplete';
  end if;
  delete from public.application_accounts where user_id = 'user_rur_delete_A';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FAIL: missing-root retry unexpected'; end if;

  perform set_config('request.jwt.claims', '{"sub":"user_rur_delete_B","role":"authenticated"}', true);
  if not exists (select 1 from public.application_accounts) or not exists (select 1 from public.tasks) then
    raise exception 'FAIL: deletion affected B';
  end if;
end;
$$;

select set_config('request.jwt.claims', '{}', true);
set local role anon;
do $$
begin
  begin
    delete from public.application_accounts;
    raise exception 'FAIL: anonymous root deletion granted';
  exception when insufficient_privilege then null;
  end;
end;
$$;
rollback;
