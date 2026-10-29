-- Editable web addresses (slugs) for blog posts and past sessions.
-- Run this once in Supabase SQL Editor BEFORE deploying the version that uses slugs.
alter table posts add column if not exists slug text;
alter table sessions add column if not exists slug text;
create unique index if not exists posts_slug_key on posts (slug) where slug is not null;
create unique index if not exists sessions_slug_key on sessions (slug) where slug is not null;
