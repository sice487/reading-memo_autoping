# 読書・視聴メモアプリ(Phase 1)

個人用の読書・映像作品メモアプリです。本Phaseでは「手動登録 + 一覧表示」のみを実装しています。

## 技術スタック
- Next.js 14(App Router) + TypeScript
- Tailwind CSS
- Supabase(PostgreSQL)

## セットアップ手順

### 1. Supabaseプロジェクトを作成
https://supabase.com で無料プロジェクトを作成します。

### 2. テーブルを作成
Supabaseダッシュボードの `SQL Editor` を開き、`supabase/schema.sql` の内容をそのまま貼り付けて実行してください。
`items` `records` `tags` `record_tags` の4テーブルが作成されます(Phase1で使うのは `items` のみです)。

### 3. APIキーを取得
`Project Settings > API` から以下を取得します。
- Project URL
- anon public キー

### 4. 環境変数を設定
このフォルダ直下の `.env.local.example` を `.env.local` にコピーし、取得した値を設定してください。

```
NEXT_PUBLIC_SUPABASE_URL=取得したProject URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=取得したanonキー
```

### 5. 依存パッケージのインストール
VSCodeのターミナル(このフォルダで)を開き、以下を実行します。

```
npm install
```

### 6. 開発サーバーの起動

```
npm run dev
```

ブラウザで http://localhost:3000 を開くと、ウィッシュリスト画面が表示されます。

## このPhaseで実装している機能
- 種類(本 / 漫画 / 映画 / アニメ / ドラマ)・タイトル・作者監督・出版社制作会社・サムネイルURLを手動入力して登録
- 登録時にウィッシュリスト / 記録済みのどちらに入れるかを選択
- 2画面(ウィッシュリスト・記録済み一覧)をタブで切り替え
- スマホ幅でも崩れないレスポンシブレイアウト

## このPhaseでまだ実装していない機能(次のPhaseで対応予定)
- Phase2:既存アイテムの編集・削除、ウィッシュリストからの「完了にする」操作
- Phase3:評価(★1〜5)・感想・タグの記録と絞り込み
- Phase4:タイトル入力時の自動情報取得(Google Books API / TMDb API)

## フォルダ構成(主要ファイル)
```
app/
  layout.tsx          共通レイアウト・ヘッダー
  page.tsx            "/" を "/wishlist" へリダイレクト
  actions.ts          アイテム登録のServer Action
  wishlist/page.tsx   ウィッシュリスト画面
  completed/page.tsx  記録済み一覧画面
components/
  NavTabs.tsx          2画面切り替えタブ
  ItemList.tsx         一覧表示
  ItemCard.tsx         1件分のカード表示
  RegisterModal.tsx     新規登録モーダル
lib/supabase.ts         Supabaseクライアント
types/item.ts           型定義
supabase/schema.sql      DBスキーマ(初回のみ実行)
```
