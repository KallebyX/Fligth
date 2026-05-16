-- =========================================================================
-- 0021_gallery.sql — Community-curated aviation photo gallery
-- =========================================================================
--
-- User-generated content with moderation. Pilots upload pictures of
-- aircraft (their own training plane, airshow shots, etc.), optionally
-- tag the model + location, and other users can like / comment after the
-- post is approved by an admin.
--
-- Moderation flow:
--   upload → status='pending' → admin approves → status='approved' → public
--                            ↘ admin rejects   → status='rejected' (private)
--
-- Anti-abuse: a per-user daily upload limit is enforced via the
-- gallery_can_upload(uid) function (called from the server action).

create table public.gallery_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url text not null,
  thumbnail_url text not null,
  caption text check (caption is null or char_length(caption) <= 280),
  aircraft_model text,
  location text,
  taken_at timestamptz,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected')),
  rejection_reason text,
  moderator_id uuid references auth.users(id),
  moderated_at timestamptz,
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index ix_gallery_status_created
  on public.gallery_posts (status, created_at desc);
create index ix_gallery_user
  on public.gallery_posts (user_id, created_at desc);

create table public.gallery_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.gallery_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
create index ix_gallery_likes_post on public.gallery_likes (post_id);

create table public.gallery_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.gallery_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index ix_gallery_comments_post
  on public.gallery_comments (post_id, created_at);

create table public.gallery_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.gallery_posts(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null
    check (reason in ('inappropriate','spam','irrelevant','other')),
  details text,
  status text not null default 'pending'
    check (status in ('pending','resolved')),
  created_at timestamptz not null default now(),
  unique (post_id, reporter_id)
);

-- ----- triggers to keep counts in sync -----------------------------------
create or replace function public.gallery_likes_bump()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    update public.gallery_posts
       set likes_count = likes_count + 1
     where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update public.gallery_posts
       set likes_count = greatest(0, likes_count - 1)
     where id = OLD.post_id;
  end if;
  return null;
end;
$$;
drop trigger if exists trg_gallery_likes_bump on public.gallery_likes;
create trigger trg_gallery_likes_bump
  after insert or delete on public.gallery_likes
  for each row execute procedure public.gallery_likes_bump();

create or replace function public.gallery_comments_bump()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    update public.gallery_posts
       set comments_count = comments_count + 1
     where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update public.gallery_posts
       set comments_count = greatest(0, comments_count - 1)
     where id = OLD.post_id;
  end if;
  return null;
end;
$$;
drop trigger if exists trg_gallery_comments_bump on public.gallery_comments;
create trigger trg_gallery_comments_bump
  after insert or delete on public.gallery_comments
  for each row execute procedure public.gallery_comments_bump();

-- ----- daily upload rate-limit ------------------------------------------
create or replace function public.gallery_can_upload(uid uuid)
returns boolean
language sql
stable
as $$
  select count(*) < 3
    from public.gallery_posts
   where user_id = uid
     and created_at > now() - interval '24 hours';
$$;

-- ----- storage bucket ----------------------------------------------------
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

drop policy if exists "gallery_public_read"   on storage.objects;
drop policy if exists "gallery_owner_insert"  on storage.objects;
drop policy if exists "gallery_owner_delete"  on storage.objects;
create policy "gallery_public_read"
  on storage.objects for select
  using (bucket_id = 'gallery');
create policy "gallery_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'gallery'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "gallery_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'gallery'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ----- RLS ---------------------------------------------------------------
alter table public.gallery_posts    enable row level security;
alter table public.gallery_likes    enable row level security;
alter table public.gallery_comments enable row level security;
alter table public.gallery_reports  enable row level security;

-- Posts: anyone authenticated reads approved posts + their own (any status).
-- Insert: only as self. Update: only by admins (status / rejection_reason).
-- Delete: only by owner.
create policy "posts: read approved or own"
  on public.gallery_posts for select
  using (
    auth.role() = 'authenticated'
    and (status = 'approved' or auth.uid() = user_id)
  );
create policy "posts: insert own"
  on public.gallery_posts for insert
  with check (auth.uid() = user_id);
create policy "posts: delete own"
  on public.gallery_posts for delete
  using (auth.uid() = user_id);
create policy "posts: admins moderate"
  on public.gallery_posts for update
  using (
    exists (
      select 1 from public.profiles
       where id = auth.uid() and role = 'admin'
    )
  );

-- Likes: read all (counts are public), insert/delete self.
create policy "likes: read all"
  on public.gallery_likes for select
  using (auth.role() = 'authenticated');
create policy "likes: insert own"
  on public.gallery_likes for insert
  with check (auth.uid() = user_id);
create policy "likes: delete own"
  on public.gallery_likes for delete
  using (auth.uid() = user_id);

-- Comments: read all on approved posts + own posts, insert self, delete self.
create policy "comments: read all"
  on public.gallery_comments for select
  using (
    auth.role() = 'authenticated'
    and exists (
      select 1 from public.gallery_posts p
       where p.id = gallery_comments.post_id
         and (p.status = 'approved' or p.user_id = auth.uid())
    )
  );
create policy "comments: insert own"
  on public.gallery_comments for insert
  with check (auth.uid() = user_id);
create policy "comments: delete own"
  on public.gallery_comments for delete
  using (auth.uid() = user_id);

-- Reports: insert self, read by reporter + admins.
create policy "reports: read own or admin"
  on public.gallery_reports for select
  using (
    auth.uid() = reporter_id
    or exists (
      select 1 from public.profiles
       where id = auth.uid() and role = 'admin'
    )
  );
create policy "reports: insert own"
  on public.gallery_reports for insert
  with check (auth.uid() = reporter_id);
