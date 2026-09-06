-- Menutup temuan "RLS Disabled in Public" dari Supabase Advisor.
--
-- Konteks: setiap tabel di schema `public` hanya disentuh dari sisi server lewat Prisma, yang
-- tersambung sebagai peran pemilik tabel (`postgres`). Pemilik tabel melewati RLS selama tidak
-- dipaksakan dengan FORCE ROW LEVEL SECURITY, jadi mengaktifkan RLS tanpa satu pun policy akan
-- menolak akses lewat PostgREST (peran `anon` dan `authenticated`) tanpa mengubah perilaku aplikasi.
--
-- Kunci anon Supabase di aplikasi ini hanya dipakai untuk kanal Realtime (broadcast & presence),
-- bukan untuk membaca/menulis tabel, jadi tidak ada jalur yang perlu policy. Sengaja tidak ada
-- CREATE POLICY: menambah policy justru membuka akses yang tidak pernah dibutuhkan.
--
-- Jalankan lewat Supabase SQL Editor, atau:
--   psql "$SUPABASE_DIRECT_URL" -f prisma/sql/enable-rls.sql

-- Aktifkan RLS di SEMUA tabel public yang belum punya, sekarang dan nanti. Idempoten.
do $$
declare
  target regclass;
begin
  for target in
    select ('public.' || quote_ident(tablename))::regclass
    from pg_tables
    where schemaname = 'public'
      and rowsecurity = false
  loop
    execute format('alter table %s enable row level security', target);
    raise notice 'RLS enabled: %', target;
  end loop;
end $$;

-- Pemeriksaan: semua baris harus rowsecurity = true.
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- ---------------------------------------------------------------------------
-- Bersih-bersih opsional (TIDAK dijalankan otomatis; hapus komentar bila mau).
--
-- Tabel di bawah sudah tidak punya model Prisma dan tidak dibaca kode mana pun — sisa fitur
-- login Google + sosial yang dicabut di commit 2fb5eea. Menghapusnya menutup temuan Advisor
-- untuk selamanya, bukan sekadar menutup akses. `users`, `accounts`, `sessions` masih menyimpan
-- 1 baris data user lama; penghapusan tidak bisa dibatalkan.
--
-- drop table if exists public.verification_tokens;
-- drop table if exists public.sessions;
-- drop table if exists public.accounts;
-- drop table if exists public.friend_requests;
-- drop table if exists public.tasks;
-- drop table if exists public.uno_rooms;
-- drop table if exists public.users;
--
-- Satu-satunya tabel public yang masih dipakai: `game_rooms` (model Prisma GameRoom).
