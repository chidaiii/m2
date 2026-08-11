/**
 * YouTube再生リスト一括登録スクリプト
 *
 * 使い方:
 *   npm run import:playlist
 *
 * 動作フロー:
 *   1. 指定した再生リスト（複数可）から全動画を取得（ページネーション対応、リスト間の重複は除去）
 *   2. microCMSの既存データと照合し、重複をスキップ
 *   3. 新規動画のみ microCMS に登録
 *   4. microCMSに登録済みの全動画についてYouTube上での視聴可否を確認し、
 *      削除・非公開になっている動画は下書きに戻す（サイトから非表示化）
 *
 * 再実行すると新規動画だけが追加され、視聴不可になった動画は下書きに戻される。
 */

import { createClient } from "microcms-js-sdk";
import { extractVideoId, checkVideoAvailability } from "../src/lib/youtube.js";

// ---- 環境変数 ----
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
// YOUTUBE_PLAYLIST_IDS: カンマ区切りで複数指定可（YouTubeは1再生リスト200本超で編集不可になるため）
// 後方互換のため、未設定なら単数形の YOUTUBE_PLAYLIST_ID にフォールバック
const YOUTUBE_PLAYLIST_IDS = (
  process.env.YOUTUBE_PLAYLIST_IDS ?? process.env.YOUTUBE_PLAYLIST_ID ?? ""
)
  .split(",")
  .map((id) => id.trim())
  .filter((id) => id.length > 0);
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

// ---- microCMS: 登録済み動画 の全件取得 ----

interface ExistingWork {
  id: string;
  videoId: string;
}

/**
 * microCMS の works に登録済み（公開済み）の動画を全件取得する。
 * offset ベースのページネーションで全件走査する。
 */
async function fetchExistingWorks(
  client: ReturnType<typeof createClient>
): Promise<ExistingWork[]> {
  const existingWorks: ExistingWork[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const data = await client.getList<{ id: string; youtubeUrl: string }>({
      endpoint: "works",
      queries: { limit, offset, fields: "id,youtubeUrl" },
    });

    for (const work of data.contents) {
      const videoId = extractVideoId(work.youtubeUrl);
      if (videoId) existingWorks.push({ id: work.id, videoId });
    }

    if (offset + limit >= data.totalCount) break;
    offset += limit;
  }

  return existingWorks;
}

// ---- メイン処理 ----

async function main() {
  // 環境変数チェック
  if (!YOUTUBE_API_KEY) {
    throw new Error("環境変数 YOUTUBE_API_KEY が設定されていません");
  }
  if (YOUTUBE_PLAYLIST_IDS.length === 0) {
    throw new Error(
      "環境変数 YOUTUBE_PLAYLIST_IDS（またはYOUTUBE_PLAYLIST_ID）が設定されていません"
    );
  }
  if (!MICROCMS_SERVICE_DOMAIN) {
    throw new Error("環境変数 MICROCMS_SERVICE_DOMAIN が設定されていません");
  }
  if (!MICROCMS_WRITE_API_KEY) {
    throw new Error("環境変数 MICROCMS_WRITE_API_KEY が設定されていません");
  }

  console.log("=== YouTube 再生リスト一括登録スクリプト ===");
  console.log(`再生リストID: ${YOUTUBE_PLAYLIST_IDS.join(", ")}`);

  // microCMS クライアント（書き込み権限のある API キーを使用）
  const client = createClient({
    serviceDomain: MICROCMS_SERVICE_DOMAIN,
    apiKey: MICROCMS_WRITE_API_KEY,
  });

  // Step 1: YouTube 再生リストの全動画を取得（複数指定時は順に取得してマージ）
  console.log("\n[1/6] YouTube 再生リストを取得中...");
  const fetchedItems: PlaylistItem[] = [];
  for (const playlistId of YOUTUBE_PLAYLIST_IDS) {
    const items = await fetchPlaylistItems(YOUTUBE_API_KEY, playlistId);
    console.log(`  → [${playlistId}] ${items.length} 件の動画を取得しました`);
    fetchedItems.push(...items);
  }

  // 同じ動画が複数の再生リストに含まれる場合があるため、動画IDで重複除去
  const seenVideoIds = new Set<string>();
  const playlistItems = fetchedItems.filter((item) => {
    if (seenVideoIds.has(item.videoId)) return false;
    seenVideoIds.add(item.videoId);
    return true;
  });
  console.log(
    `  → 合計 ${playlistItems.length} 件（再生リスト間の重複除去後）`
  );

  // Step 2: microCMS の登録済み動画を取得
  console.log("\n[2/6] microCMS の既存データを確認中...");
  const existingWorks = await fetchExistingWorks(client);
  const existingVideoIds = new Set(existingWorks.map((w) => w.videoId));
  console.log(`  → 登録済み: ${existingWorks.length} 件`);

  // Step 3: 新規動画の抽出（動画IDベースで重複判定）
  console.log("\n[3/6] 重複チェック中...");
  const newItems = playlistItems.filter(
    (item) => !existingVideoIds.has(item.videoId)
  );
  const skipCount = playlistItems.length - newItems.length;
  console.log(`  → 新規: ${newItems.length} 件 / スキップ: ${skipCount} 件`);

  // Step 4: microCMS に新規登録
  console.log("\n[4/6] microCMS に登録中...");

  let successCount = 0;
  const failures: Array<{ title: string; error: string }> = [];

  if (newItems.length === 0) {
    console.log("  → 新規登録する動画はありませんでした。");
  }

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

  // Step 5: 登録済み動画のうち、YouTube上で視聴できなくなったものを判定
  console.log("\n[5/6] 登録済み動画の視聴可否を確認中...");
  const availableIds = await checkVideoAvailability(
    existingWorks.map((w) => w.videoId),
    YOUTUBE_API_KEY
  );
  const unavailableWorks = existingWorks.filter(
    (w) => !availableIds.has(w.videoId)
  );
  console.log(
    `  → 視聴不可: ${unavailableWorks.length} 件 / 視聴可能: ${existingWorks.length - unavailableWorks.length} 件`
  );

  // Step 6: 視聴不可の動画を下書きに戻す（サイトから非表示化）
  console.log("\n[6/6] 視聴不可の動画を下書きに戻しています...");

  let unpublishCount = 0;
  const unpublishFailures: Array<{ id: string; error: string }> = [];

  if (unavailableWorks.length === 0) {
    console.log("  → 対象の動画はありませんでした。");
  }

  for (let i = 0; i < unavailableWorks.length; i++) {
    const work = unavailableWorks[i];

    try {
      await client.update({
        endpoint: "works",
        contentId: work.id,
        content: {},
        isDraft: true,
      });

      console.log(
        `  [${i + 1}/${unavailableWorks.length}] 下書き化完了: ${work.videoId}`
      );
      unpublishCount++;

      if (i < unavailableWorks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `  [${i + 1}/${unavailableWorks.length}] 下書き化失敗: ${work.videoId}`
      );
      console.error(`    エラー: ${message}`);
      unpublishFailures.push({ id: work.id, error: message });
    }
  }

  // 結果サマリー
  console.log("\n=== 完了 ===");
  console.log(`  新規登録:     ${successCount} 件`);
  console.log(`  スキップ:     ${skipCount} 件（登録済み）`);
  console.log(`  下書き化:     ${unpublishCount} 件（視聴不可）`);
  if (failures.length > 0 || unpublishFailures.length > 0) {
    if (failures.length > 0) {
      console.log(`  登録失敗:     ${failures.length} 件`);
      for (const f of failures) {
        console.log(`    - ${f.title}: ${f.error}`);
      }
    }
    if (unpublishFailures.length > 0) {
      console.log(`  下書き化失敗: ${unpublishFailures.length} 件`);
      for (const f of unpublishFailures) {
        console.log(`    - ${f.id}: ${f.error}`);
      }
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
