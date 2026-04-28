-- 0003 · auth.users → zhiyu.profiles 自动创建（替代 GoTrue before_user_created Hook 的 fallback）
create or replace function zhiyu.handle_new_user() returns trigger
language plpgsql security definer as $$
declare
  v_role text;
begin
  -- 来自 GoTrue raw_user_meta_data.role；缺省为 user
  v_role := coalesce(new.raw_user_meta_data->>'role', 'user');
  if v_role not in ('super_admin','user') then v_role := 'user'; end if;

  insert into zhiyu.profiles (id, email, role, display_name, locale, is_active, email_verified_at)
  values (
    new.id,
    new.email,
    v_role,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'locale', 'zh'),
    true,
    case when new.email_confirmed_at is not null then new.email_confirmed_at else null end
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists trg_handle_new_user on auth.users;
create trigger trg_handle_new_user
  after insert on auth.users
  for each row execute function zhiyu.handle_new_user();

-- email_confirmed_at 同步
create or replace function zhiyu.sync_email_confirmed() returns trigger
language plpgsql security definer as $$
begin
  if new.email_confirmed_at is distinct from old.email_confirmed_at then
    update zhiyu.profiles set email_verified_at = new.email_confirmed_at, updated_at = now() where id = new.id;
  end if;
  return new;
end; $$;

drop trigger if exists trg_sync_email_confirmed on auth.users;
create trigger trg_sync_email_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function zhiyu.sync_email_confirmed();
