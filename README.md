# motion×music col.

モーショングラフィックス特化の動画ギャラリーサイト。
YouTubeの作品をグリッド表示し、タグで絞り込んで視聴できます。

## 技術スタック

- **Next.js 15** (App Router / TypeScript / ISR)
- **microCMS** — 作品データの管理
- **Vercel** — ホスティング

---

## microCMS APIスキーマ設定手順

### 1. APIを追加

1. [microCMS管理画面](https://app.microcms.io) にログイン
2. 左サイドバーの「APIを追加」
3. API名 `works`、エンドポイント `works`、種類は **リスト形式** で作成

### 2. フィールドを追加

| フィールドID | 表示名 | 種別 | 必須 |
|---|---|---|---|
| `youtubeUrl` | YouTube URL | テキストフィールド | ✅ |
| `title` | タイトル | テキストフィールド | — |
| `type` | タイプ | 複数選択 | — |
| `style` | スタイル | 複数選択 | — |
| `genre` | ジャンル | 複数選択 | — |

#### type（タイプ）の選択肢

値（value）を以下の通り設定してください：

- `アニメ`
- `実写`
- `3DCG`
- `モーショングラフィックス`

#### style（スタイル）の選択肢

- `ポップ`
- `クール`
- `かわいい`
- `サブカル`
- `スタイリッシュ`
- `和風`

#### genre（ジャンル）の選択肢

- `ポップス`
- `アイドル`
- `ロック`
- `電子音楽`
- `ラップ`

> **重要：** 選択肢の「値（value）」は `src/lib/tags.ts` の定数と完全に一致させてください。
> microCMSの複数選択フィールドでは「表示名」と「値」が別設定になっている場合があるため注意してください。

---

## 環境変数の設定

### ローカル開発

プロジェクトルートに `.env.local` を作成（`.env.local.example` をコピーして編集）：

```env
# microCMS
MICROCMS_SERVICE_DOMAIN=your-service-domain
MICROCMS_API_KEY=your-read-api-key
MICROCMS_WRITE_API_KEY=your-write-api-key

# YouTube Data API v3（再生リスト一括登録スクリプト用）
YOUTUBE_API_KEY=your-youtube-api-key
# 複数の再生リストをカンマ区切りで指定可能
YOUTUBE_PLAYLIST_IDS=your-playlist-id-1,your-playlist-id-2
```

**各値の確認場所：**

| 変数名 | 用途 | 確認場所 |
|---|---|---|
| `MICROCMS_SERVICE_DOMAIN` | microCMS サービス識別子 | microCMS管理画面URLの `/service/` 以降の部分（例: `abc123`） |
| `MICROCMS_API_KEY` | microCMS 読み取り用APIキー | microCMS管理画面 → API設定 → APIキー |
| `MICROCMS_WRITE_API_KEY` | microCMS 書き込み用APIキー | 同上（権限に「書き込み」が含まれるキーを使用） |
| `YOUTUBE_API_KEY` | YouTube Data API v3 キー | Google Cloud Console（下記参照） |
| `YOUTUBE_PLAYLIST_IDS` | インポート対象の再生リストID（複数可、カンマ区切り） | YouTube再生リストのURLから取得（下記参照） |

> **`MICROCMS_API_KEY` と `MICROCMS_WRITE_API_KEY` について**
>
> microCMS では APIキーごとに読み取り／書き込み権限を設定できます。
> サイト表示（Next.js）には読み取り専用キーを、一括登録スクリプトには書き込み権限付きキーを使うことを推奨します。
> 同じキーに両方の権限を付与している場合は、同じ値を両方に設定しても構いません。

### Vercel（本番）

Vercel管理画面 → プロジェクト → **Settings → Environment Variables** に以下を追加してください：

- `MICROCMS_SERVICE_DOMAIN`
- `MICROCMS_API_KEY`

`MICROCMS_WRITE_API_KEY` / `YOUTUBE_API_KEY` / `YOUTUBE_PLAYLIST_IDS` はスクリプトのローカル実行専用のため、Vercelへの登録は不要です。

---

## 投稿フォーム（審査制）

### 概要

サイト右上の **「+ 投稿」** ボタンから、誰でも作品を投稿できます。
投稿は即公開されず、microCMS に **下書き** として保存されます。管理者が確認・承認後に公開されます。

### 投稿フォームの場所

- **ボタン**: 全ページ共通のヘッダー右上に常設
- **フォーム**: ボタンを押すとモーダルが開く

### 入力項目

| 項目 | 必須 | 備考 |
|---|---|---|
| YouTube URL | ✅ | 動画IDが抽出できない場合はエラー表示 |
| タイプ | — | 複数選択可 |
| スタイル | — | 複数選択可 |
| ジャンル | — | 複数選択可 |

タイトルは投稿者に入力させません（承認時に管理者が設定）。

### 環境変数（投稿フォーム用）

投稿フォームは `MICROCMS_WRITE_API_KEY` を使用します。この変数はサーバー側（Next.js API Route）でのみ参照され、フロントエンドには露出しません。

Vercel にもこの変数を追加してください：

| 変数名 | 用途 |
|---|---|
| `MICROCMS_WRITE_API_KEY` | 投稿フォームからの下書き保存に使用 |

### 管理者の承認フロー

1. microCMS 管理画面 → `works` API を開く
2. **「下書き」** タブに投稿が溜まっているのを確認する
3. 投稿内容（YouTube URL・タグ）を確認する
4. **タイトル** を入力する（YouTube動画名を元に管理者が整える）
5. 問題なければ **「公開」** に切り替える → サイトに反映

> **注意**: `getWorks()` は ISR（revalidate: 3600）でキャッシュされます。公開後、最大1時間でサイトに反映されます。

### セキュリティ設計

- `MICROCMS_WRITE_API_KEY` はサーバー側（`src/app/api/submit/route.ts`）でのみ扱い、フロントエンドに露出しません
- フロントのバリデーションを信用せず、API Route でも YouTube URL を再検証します

### スパム対策の拡張ポイント

`src/app/api/submit/route.ts` 内の `validateSubmission` 関数が差し込み口です。
現在は素通りですが、この関数の中身を reCAPTCHA 等に差し替えるだけで対応できます。

---

## YouTube再生リスト一括登録スクリプト

microCMS に手動登録するかわりに、YouTube の再生リストから作品をまとめてインポートできます。

### 事前準備

#### 1. YouTube Data API v3 キーの取得

1. [Google Cloud Console](https://console.cloud.google.com/) にログイン
2. プロジェクトを作成（または既存を選択）
3. 左メニュー → **APIとサービス → ライブラリ** → `YouTube Data API v3` を有効化
4. **APIとサービス → 認証情報 → 認証情報を作成 → APIキー** でキーを生成
5. 生成されたキーを `YOUTUBE_API_KEY` に設定

#### 2. 再生リストIDの確認

インポート対象の再生リストを YouTube で開き、URL から ID を確認します：

```
https://www.youtube.com/playlist?list=PLxxxxxxxxxxxxxxxxxx
                                      ↑ これが再生リストID
```

確認した ID を `YOUTUBE_PLAYLIST_IDS` に設定します。

**複数の再生リストから読み込みたい場合**（YouTubeは1つの再生リストが200本を超えると編集できなくなるため、複数リストに分けて運用したい場合など）は、カンマ区切りで複数指定できます：

```env
YOUTUBE_PLAYLIST_IDS=PLxxxxxxxxxxxxxxxxxx,PLyyyyyyyyyyyyyyyyyy
```

同じ動画が複数の再生リストに含まれていても、動画IDで自動的に重複除去されます。

#### 3. tsx のインストール

スクリプトの実行に `tsx` を使用します。初回のみインストールが必要です：

```bash
npm install
```

### 実行方法

```bash
npm run import:playlist
```

### 実行結果の例

```
=== YouTube 再生リスト一括登録スクリプト ===
再生リストID: PLxxxxxxxxxxxxxxxxxx, PLyyyyyyyyyyyyyyyyyy

[1/4] YouTube 再生リストを取得中...
  → 25 件の動画を取得しました

[2/4] microCMS の既存データを確認中...
  → 登録済み: 10 件

[3/4] 重複チェック中...
  → 新規: 15 件 / スキップ: 10 件

[4/4] microCMS に登録中...
  [1/15] 登録完了: 動画タイトル1
  [2/15] 登録完了: 動画タイトル2
  ...

=== 完了 ===
  新規登録: 15 件
  スキップ: 10 件（登録済み）
```

### 再実行時の挙動

スクリプトを再実行すると、**新規動画だけが追加**されます。
重複判定は YouTube 動画ID ベースで行うため、URL の表記ゆれ（`youtube.com/watch?v=xxx` と `youtu.be/xxx` 等）があっても正しくスキップされます。

### タグの自動付与について（将来の拡張）

現在、登録時の `type` / `style` / `genre` タグは空になります（後から管理画面で手動設定）。
将来的に Gemini API 等でタグを自動付与したい場合は、`scripts/import-playlist.ts` 内の `classifyVideo` 関数の中身を差し替えるだけで対応できます。スクリプト全体の構造変更は不要です。

---

## ローカル起動手順

```bash
# 1. 依存パッケージのインストール
npm install

# 2. 環境変数を設定（上記参照）

# 3. 開発サーバー起動
npm run dev
# → http://localhost:3000 で確認できます
```

---

## Vercelデプロイ手順

1. このリポジトリをGitHubにプッシュ
2. [Vercel](https://vercel.com) にログイン → **Add New Project**
3. リポジトリをインポート
4. **Environment Variables** に `MICROCMS_SERVICE_DOMAIN` と `MICROCMS_API_KEY` を設定
5. **Deploy** をクリック

### 作品追加後の反映タイミング

デフォルトではISR（`revalidate: 3600`）により **最大1時間** でサイトに反映されます。

即時反映したい場合は、microCMSのWebhookとNext.jsのRoute Handler（`/api/revalidate`）を組み合わせたオンデマンドrevalidateを追加実装してください（本バージョンでは未実装）。

---

## 作品の追加運用フロー

1. microCMS管理画面 → `works` API → 「追加」ボタン
2. **YouTube URL** を入力（例: `https://www.youtube.com/watch?v=xxxxx`）
3. **タイトル** を入力（空欄可。空欄の場合はビルド時にYouTubeからタイトルを自動取得）
4. **タグ**（タイプ / スタイル / ジャンル）を選択
5. 「公開」ボタンをクリック
6. 最大1時間でサイトに反映される

---

## ディレクトリ構成

```
src/
├── app/
│   ├── layout.tsx          # ルートレイアウト・メタデータ
│   ├── page.tsx            # トップページ（Server Component / ISR）
│   ├── page.module.css
│   └── globals.css         # ★ デザイントークン（CSS変数）・グローバルスタイル
├── components/
│   ├── WorkGrid.tsx        # フィルター状態管理・グリッド（Client Component）
│   ├── WorkCard.tsx        # 作品カード（サムネイル・タイトル）
│   ├── TagFilter.tsx       # タグ絞り込みUI
│   ├── FilterTag.tsx       # 個別タグボタン（再利用可）
│   └── VideoModal.tsx      # 動画再生モーダル
├── lib/
│   ├── microcms.ts         # microCMSクライアント・データ取得
│   ├── youtube.ts          # 動画ID抽出・サムネURL・oEmbed
│   └── tags.ts             # ★ タグ選択肢の単一ソース
└── types/
    └── work.ts             # 作品データの型定義
```

★ マークのファイルは特に改修頻度が高い箇所です。

---

## デザイントークンについて

`src/app/globals.css` の `:root` ブロックにCSS変数でデザイントークンを集中管理しています。
色・余白・フォントサイズ・角丸・トランジションはすべてここで定義されており、
**デザイン変更はこのファイルの編集だけで完結します**。

```css
:root {
  --color-bg: #0a0a0a;
  --color-accent: #e0e0e0;
  --space-md: 16px;
  /* ... */
}
```
