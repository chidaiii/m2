/**
 * YouTube再生リスト一括登録スクリプト
 *
 * 使い方:
 *   npm run import:playlist
 *
 * 動作フロー:
 *   1. 指定した再生リストから全動画を取得（ページネーション対応）
 *   2. microCMSの既存データと照合し、重複をスキップ
 *   3. 新規動画のみ microCMS に登録
 *
 * 再実行すると新規動画だけが追加される。既存登録済みはスキップされる。
 */

import { createClient } from "microcms-js-sdk";
import { extractVideoId } from "../src/lib/youtube.js";

// ---- 環境変数 ----
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_PLAYLIST_ID = process.env.YOUTUBE_PLAYLIST_ID;
const MICROCMS_SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const MICROCMS_WRITE_API_KEY = process.env.MICROCMS_WRITE_API_KEY;

/** microCMS への書き込み間隔（レート制限対策）*/
const RATE_LIMIT_MS = 500;

// ---- 型定義 ----

interface PlaylistItem {
  videoId: string;
  title: string;
  youtubeUrl: string;
}

interface VideoTags {
  type: string[];
  style: string[];
  genre: string[];
}

// ---- タグ自動分類（将来の拡張ポイント） ----
/**
 * 動画情報からタグ（type / style / genre）を返す関数。
 *
 * 【将来の拡張について】
 * 現在は空配列を返すスタブ実装。後からタグ自動付与に切り替えたい場合は、
 * この関数の中身だけを Gemini API 等の呼び出しに差し替えれば OK。
 * スクリプト全体の構造変更は不要。
 *
 * 期待するシグネチャ:
 *   入力: videoId, title, youtubeUrl
 *   出力: { type, style, genre } — それぞれ src/lib/tags.ts の定数値と一致する文字列配列
 */
async function classifyVideo(
  _videoId: string,
  _title: string,
  _youtubeUrl: string
): Promise<VideoTags> {
  // TODO: ここを Gemini API 等の実装に差し替える
  return { type: [], style: [], genre: [] };
}

// ---- YouTube Data API v3: 再生リスト全件取得 ----

interface YouTubePlaylistItemsResponse {
  nextPageToken?: string;
  items: Array<{
    snippet: {
      title: string;
      resourceId: { videoId: string };
    };
  }>;
}

/**
 * 再生リストの全動画を取得する。
 * YouTube Data API は1回50件までのため、pageToken でページネーションを行う。
 */
async function fetchPlaylistItems(
  apiKey: string,
  playlistId: string
): Promise<PlaylistItem[]> {
  const items: PlaylistItem[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      part: "snippet",
      playlistId,
      maxResults: "50",
      key: apiKey,
      ...(pageToken ? { pageToken } : {}),
    });

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?${params}`
    );

    if (!res.ok) {
      const error: unknown = await res.json();
      throw new Error(`YouTube API エラー: ${JSON.stringify(error)}`);
    }

    const data = (await res.json()) as YouTubePlaylistItemsResponse;

    for (const item of data.items) {
      const videoId = item.snippet.resourceId.videoId;
      const title = item.snippet.title;

      // 非公開・削除済み動画はスキップ
      if (!videoId || title === "Private video" || title === "Deleted video") {
        continue;
      }

      items.push({
        videoId,
        title,
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
      });
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return items;
}

// ---- microCMS: 登録済み動画ID の全件取得 ----

/**
 * microCMS の works に登録済みの YouTube 動画ID を全件取得して Set で返す。
 * offset ベースのページネーションで全件走査する。
 */
async function fetchExistingVideoIds(
  client: ReturnType<typeof createClient>
): Promise<Set<string>> {
  const existingVideoIds = new Set<string>();
  let offset = 0;
  const limit = 100;

  while (true) {
    const data = await client.getList<{ youtubeUrl: string }>({
      endpoint: "works",
      queries: { limit, offset, fields: "youtubeUrl" },
    });

    for (const work of data.contents) {
      const videoId = extractVideoId(work.youtubeUrl);
      if (videoId) existingVideoIds.add(videoId);
    }

    if (offset + limit >= data.totalCount) break;
    offset += limit;
  }

  return existingVideoIds;
}

// ---- メイン処理 ----

async function main() {
  // 環境変数チェック
  if (!YOUTUBE_API_KEY) {
    throw new Error("環境変数 YOUTUBE_API_KEY が設定されていません");
  }
  if (!YOUTUBE_PLAYLIST_ID) {
    throw new Error("環境変数 YOUTUBE_PLAYLIST_ID が設定されていません");
  }
  if (!MICROCMS_SERVICE_DOMAIN) {
    throw new Error("環境変数 MICROCMS_SERVICE_DOMAIN が設定されていません");
  }
  if (!MICROCMS_WRITE_API_KEY) {
    throw new Error("環境変数 MICROCMS_WRITE_API_KEY が設定されていません");
  }

  console.log("=== YouTube 再生リスト一括登録スクリプト ===");
  console.log(`再生リストID: ${YOUTUBE_PLAYLIST_ID}`);

  // microCMS クライアント（書き込み権限のある API キーを使用）
  const client = createClient({
    serviceDomain: MICROCMS_SERVICE_DOMAIN,
    apiKey: MICROCMS_WRITE_API_KEY,
  });

  // Step 1: YouTube 再生リストの全動画を取得
  console.log("\n[1/4] YouTube 再生リストを取得中...");
  const playlistItems = await fetchPlaylistItems(
    YOUTUBE_API_KEY,
    YOUTUBE_PLAYLIST_ID
  );
  console.log(`  → ${playlistItems.length} 件の動画を取得しました`);

  // Step 2: microCMS の登録済み動画ID を取得
  console.log("\n[2/4] microCMS の既存データを確認中...");
  const existingVideoIds = await fetchExistingVideoIds(client);
  console.log(`  → 登録済み: ${existingVideoIds.size} 件`);

  // Step 3: 新規動画の抽出（動画IDベースで重複判定）
  console.log("\n[3/4] 重複チェック中...");
  const newItems = playlistItems.filter(
    (item) => !existingVideoIds.has(item.videoId)
  );
  const skipCount = playlistItems.length - newItems.length;
  console.log(`  → 新規: ${newItems.length} 件 / スキップ: ${skipCount} 件`);

  if (newItems.length === 0) {
    console.log("\n新規登録する動画はありませんでした。");
    console.log(`スキップ: ${skipCount} 件（登録済み）`);
    return;
  }

  // Step 4: microCMS に新規登録
  console.log("\n[4/4] microCMS に登録中...");

  let successCount = 0;
  const failures: Array<{ title: string; error: string }> = [];

  for (let i = 0; i < newItems.length; i++) {
    const item = newItems[i];

    try {
      // タグ自動分類（現在はスタブ。将来 Gemini 等に差し替え可能）
      const tags = await classifyVideo(item.videoId, item.title, item.youtubeUrl);

      await client.create({
        endpoint: "works",
        content: {
          youtubeUrl: item.youtubeUrl,
          title: item.title,
          type: tags.type,
          style: tags.style,
          genre: tags.genre,
        },
      });

      console.log(`  [${i + 1}/${newItems.length}] 登録完了: ${item.title}`);
      successCount++;

      // レート制限対策: 最後の1件以外は待機
      if (i < newItems.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  [${i + 1}/${newItems.length}] 登録失敗: ${item.title}`);
      console.error(`    エラー: ${message}`);
      failures.push({ title: item.title, error: message });
    }
  }

  // 結果サマリー
  console.log("\n=== 完了 ===");
  console.log(`  新規登録: ${successCount} 件`);
  console.log(`  スキップ: ${skipCount} 件（登録済み）`);
  if (failures.length > 0) {
    console.log(`  失敗:     ${failures.length} 件`);
    for (const f of failures) {
      console.log(`    - ${f.title}: ${f.error}`);
    }
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error(
    "致命的なエラーが発生しました:",
    err instanceof Error ? err.message : err
  );
  process.exit(1);
});
