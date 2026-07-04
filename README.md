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
MICROCMS_SERVICE_DOMAIN=your-service-domain
MICROCMS_API_KEY=your-api-key
```

**各値の確認場所：**

| 変数名 | 確認場所 |
|---|---|
| `MICROCMS_SERVICE_DOMAIN` | microCMS管理画面URLの `/service/` 以降の部分（例: `abc123`） |
| `MICROCMS_API_KEY` | microCMS管理画面 → API設定 → APIキー |

### Vercel（本番）

Vercel管理画面 → プロジェクト → **Settings → Environment Variables** に上記2変数を追加してください。

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
