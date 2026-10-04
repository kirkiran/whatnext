-- Slice 4: review and apply manually to the development database.
begin;

grant delete on public.application_accounts to authenticated;
create policy accounts_delete_own on public.application_accounts
  for delete to authenticated
  using (user_id = (select auth.jwt()->>'sub'));

commit;
