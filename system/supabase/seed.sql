-- supabase/seed.sql · 由 scripts/db/seed-super-admin.sh / db-migrate 容器调用
-- 通过 psql -v admin_email=... -v admin_pwd=... 注入。
-- 注意：psql 元变量 :'name' 不能出现在 PL/pgSQL 块内，需先用 \set 转 GUC，再在 do 块内 current_setting() 读取。

\set ON_ERROR_STOP on
select set_config('zhiyu.admin_email', :'admin_email', false);
select set_config('zhiyu.admin_pwd',   :'admin_pwd',   false);

do $$
declare
  v_email text := current_setting('zhiyu.admin_email');
  v_pwd   text := current_setting('zhiyu.admin_pwd');
  v_uid   uuid;
begin
  if exists (select 1 from auth.users where email = v_email) then
    select id into v_uid from auth.users where email = v_email;
    raise notice 'super-admin exists: %', v_email;
  else
    -- GoTrue 默认 bcrypt（pgcrypto: crypt + gen_salt('bf'))
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, phone_change, phone_change_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      uuid_generate_v4(),
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_pwd, gen_salt('bf')),
      now(),
      jsonb_build_object('provider','email','providers',array['email']),
      jsonb_build_object('role','super_admin','display_name','Super Admin','locale','zh'),
      now(), now(),
      '', '',
      '', '', '',
      '', '', ''
    ) returning id into v_uid;
    raise notice 'super-admin created: %', v_email;
  end if;

  -- 将对应 profile 升级为 super_admin
  update zhiyu.profiles set role = 'super_admin', is_active = true, updated_at = now() where id = v_uid;
end $$;
