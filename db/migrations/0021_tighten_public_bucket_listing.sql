-- =========================================================================
-- 0021_tighten_public_bucket_listing.sql
-- Closes Supabase advisor `public_bucket_allows_listing` for the `avatars`
-- and `gallery` buckets. Both buckets are public (i.e. their content can
-- be served via the storage CDN without any session), so a broad SELECT
-- policy on storage.objects is unnecessary AND lets any anonymous client
-- call `GET /storage/v1/bucket/<id>/objects` to enumerate every uploaded
-- file. That's a privacy regression.
--
-- After this migration:
--   • Public read access via the CDN URL keeps working (the CDN serves
--     public buckets without RLS).
--   • Anonymous LIST operations against /storage/v1/object/list/<id>
--     are denied — clients now need a session to enumerate.
--   • Authenticated users can still read individual rows via the API
--     when constructing signed URLs.
-- =========================================================================

drop policy if exists "avatars_public_read" on storage.objects;
drop policy if exists "gallery_public_read" on storage.objects;
