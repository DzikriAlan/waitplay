-- Menutup temuan "RLS Disabled in Public" dari Supabase Advisor.
--
-- Seluruh tabel di sini hanya disentuh dari sisi server lewat Prisma, yang tersambung sebagai
-- peran `postgres` alias pemilik tabel. Pemilik tabel melewati RLS selama kebijakannya tidak
-- dipaksakan dengan FORCE ROW LEVEL SECURITY, jadi mengaktifkan RLS tanpa satu pun policy akan
-- menolak akses lewat PostgREST (peran anon dan authenticated) tanpa mengubah perilaku aplikasi.
--
-- Sengaja tidak ada CREATE POLICY: tidak ada satu pun jalur di aplikasi ini yang membaca tabel
-- tersebut memakai kunci anon. Menambahkan policy justru membuka akses yang selama ini tidak
-- pernah dibutuhkan.
--
-- Jalankan lewat Supabase SQL Editor, atau:
--   psql "$SUPABASE_DIRECT_URL" -f prisma/sql/enable-rls.sql

alter table if exists public.game_rooms enable row level security;
alter table if exists public.verification_tokens enable row level security;
alter table if exists public.tasks enable row level security;
alter table if exists public.uno_rooms enable row level security;

-- Tabel `tasks` dan `uno_rooms` sudah tidak punya model Prisma dan tidak pernah dibaca kode mana
-- pun. Keduanya aman dibuang, tetapi penghapusan tidak bisa dibatalkan jadi dibiarkan sebagai
-- pilihan sadar. Perlu diketahui: `prisma db push` akan menghapus keduanya sendiri karena modelnya
-- sudah tidak ada di schema, jadi baris di bawah hanya mempercepat hal yang memang akan terjadi.
--
-- drop table if exists public.tasks;
-- drop table if exists public.uno_rooms;

-- Pemeriksaan: seluruh baris harus mengembalikan rowsecurity = true.
-- select tablename, rowsecurity from pg_tables
-- where schemaname = 'public'
--   and tablename in ('game_rooms', 'verification_tokens', 'tasks', 'uno_rooms');
