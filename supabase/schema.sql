-- 読書・視聴メモアプリ DBスキーマ(初回に1度だけSupabaseのSQL Editorで実行してください)
-- Phase1で使用するのは items テーブルのみですが、後続Phaseで使う records/tags/record_tags も
-- 最初に一括作成しておきます。

create extension if not exists "pgcrypto";

-- 作品そのもの
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('book','manga','movie','anime','drama')),
  title text not null,
  creator text,              -- 作者 / 監督
  publisher text,            -- 出版社 / 制作会社
  thumbnail_url text,
  status text not null default 'wishlist' check (status in ('wishlist','completed')),
  external_source text,      -- 'google_books' | 'tmdb' | 'manual'
  external_id text,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 完了時の記録(Phase3で使用)
create table if not exists records (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  completed_date date not null,
  rating smallint check (rating between 1 and 5),
  review text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists record_tags (
  record_id uuid not null references records(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (record_id, tag_id)
);

create index if not exists idx_items_status on items(status);
create index if not exists idx_items_type on items(type);
create index if not exists idx_records_item_id on records(item_id);

-- 個人利用のみを想定し、Phase1ではRLS(Row Level Security)は無効のままにしています。
-- 将来ログイン機能を追加する場合は、ここでRLSを有効化しユーザーごとのポリシーを設定してください。
