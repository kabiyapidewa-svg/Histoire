-- Migration Phase 1: thèmes + photo de couple
alter table public.profiles
  add column if not exists theme text default 'rose' check (theme in ('rose','ocean','forest','sunset','noir')),
  add column if not exists couple_photo_path text;

insert into storage.buckets (id, name, public)
values ('couple-photos', 'couple-photos', false)
on conflict (id) do update set public = false;

drop policy if exists "couple_photos_read_own_or_partner" on storage.objects;
create policy "couple_photos_read_own_or_partner"
  on storage.objects for select
  using (bucket_id = 'couple-photos' and ((storage.foldername(name))[1] = auth.uid()::text or (storage.foldername(name))[1] = public.my_partner_id()::text));

drop policy if exists "couple_photos_write_own" on storage.objects;
create policy "couple_photos_write_own"
  on storage.objects for insert
  with check (bucket_id = 'couple-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "couple_photos_delete_own" on storage.objects;
create policy "couple_photos_delete_own"
  on storage.objects for delete
  using (bucket_id = 'couple-photos' and (storage.foldername(name))[1] = auth.uid()::text);
