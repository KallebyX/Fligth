-- Profile completion bonus + avatar storage.
-- 15.1: track one-shot reward for completing the profile.
-- 15.2: add avatar_url column + private bucket (RLS) for user uploads.

-- 1) profile_completed_at: stamp when the user collected the one-time
--    50-gem bonus for filling all profile fields. NULL = not yet claimed.
alter table public.user_stats
  add column if not exists profile_completed_at timestamptz;

-- 2) avatar_url: nullable. NULL => render the mascot. When present,
--    points to either an OAuth provider URL (Google picture) or to
--    a public path in the `avatars` storage bucket below.
alter table public.profiles
  add column if not exists avatar_url text;

-- 3) Storage bucket for user-uploaded avatars. Public read (avatars are
--    intentionally visible) but writes scoped to the owning user.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- RLS policies on storage.objects scoped to bucket_id='avatars'.
-- The path convention enforced by the client is `{user_id}/avatar.{ext}`,
-- which we validate by checking the first path segment matches auth.uid().
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_insert" on storage.objects;
create policy "avatars_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4) Trigger: copy OAuth provider picture into profiles.avatar_url on
--    signup, so Google users start with a face instead of the default
--    mascot. The handle_new_user() function already creates a profiles
--    row; we extend it to grab the picture from raw_user_meta_data.
create or replace function public.handle_new_user_avatar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  picture_url text;
begin
  picture_url := coalesce(
    new.raw_user_meta_data->>'picture',
    new.raw_user_meta_data->>'avatar_url',
    null
  );
  if picture_url is not null then
    update public.profiles
      set avatar_url = picture_url
      where id = new.id and avatar_url is null;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_avatar on auth.users;
create trigger on_auth_user_created_avatar
  after insert on auth.users
  for each row execute procedure public.handle_new_user_avatar();
