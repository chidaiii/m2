/**
 * YouTube関連のユーティリティ
 */

/**
 * YouTube URLから動画IDを抽出する。
 * 対応形式:
 *   https://www.youtube.com/watch?v=xxx
 *   https://youtu.be/xxx
 *   https://www.youtube.com/embed/xxx
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /[?&]v=([^&]+)/,
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * サムネイルURLを生成する。
 * maxresdefault（1280x720）を優先し、存在しない場合は
 * クライアントサイドのonErrorでhqdefaultにフォールバックする。
 */
export function getThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export function getThumbnailFallbackUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * YouTube Data API v3 を使い、動画IDのリストからYouTube投稿日を一括取得する。
 * 50件ずつバッチ処理する（APIの上限）。
 * 失敗した動画はスキップし、取得できた分のみ返す。
 */
export async function fetchYouTubePublishDates(
  videoIds: string[],
  apiKey: string
): Promise<Map<string, string>> {
  const dateMap = new Map<string, string>();
  const BATCH_SIZE = 50;

  for (let i = 0; i < videoIds.length; i += BATCH_SIZE) {
    const batch = videoIds.slice(i, i + BATCH_SIZE);
    const params = new URLSearchParams({
      part: "snippet",
      id: batch.join(","),
      key: apiKey,
      fields: "items(id,snippet/publishedAt)",
    });

    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?${params}`
      );
      if (!res.ok) continue;

      const data = (await res.json()) as {
        items: Array<{ id: string; snippet: { publishedAt: string } }>;
      };

      for (const item of data.items) {
        dateMap.set(item.id, item.snippet.publishedAt);
      }
    } catch {
      // バッチ失敗時はスキップして続行
    }
  }

  return dateMap;
}

/**
 * YouTube Data API v3 を使い、動画IDのリストのうち現在も視聴可能なもの
 * （削除・非公開になっていないもの）を判定する。
 * 50件ずつバッチ処理する（APIの上限）。
 * 削除済み・非公開の動画はレスポンスに含まれないため、
 * 返り値のSetに入っていないIDは視聴不可と判断できる。
 * バッチ失敗時は安全側に倒し、そのバッチの動画IDは「視聴可能」とみなす
 * （API障害で誤って一括非公開化されるのを防ぐため）。
 */
export async function checkVideoAvailability(
  videoIds: string[],
  apiKey: string
): Promise<Set<string>> {
  const availableIds = new Set<string>();
  const BATCH_SIZE = 50;

  for (let i = 0; i < videoIds.length; i += BATCH_SIZE) {
    const batch = videoIds.slice(i, i + BATCH_SIZE);
    const params = new URLSearchParams({
      part: "id",
      id: batch.join(","),
      key: apiKey,
      fields: "items(id)",
    });

    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?${params}`
      );
      if (!res.ok) {
        // API障害時は安全側に倒し、このバッチは全件「視聴可能」扱いにする
        batch.forEach((id) => availableIds.add(id));
        continue;
      }

      const data = (await res.json()) as { items: Array<{ id: string }> };
      for (const item of data.items) {
        availableIds.add(item.id);
      }
    } catch {
      // 通信失敗時も安全側に倒し、このバッチは全件「視聴可能」扱いにする
      batch.forEach((id) => availableIds.add(id));
    }
  }

  return availableIds;
}

/**
 * YouTube oEmbed APIを使って動画タイトルを取得する（APIキー不要）。
 *
 * 設計判断：タイトルをビルド時（getWorks内）に解決してHTMLに埋め込む方式を採用。
 * 理由：
 *   1. 毎回oEmbedを叩くのはパフォーマンス上好ましくない
 *   2. microCMSにタイトルを書き戻す自動化はWebhook+API実装が必要で複雑になる
 *   3. ISR（revalidate: 3600）により、一定間隔でキャッシュが更新されるため
 *      タイトル空欄のまま運用しても実用上問題ない
 * → Next.jsのISRで解決する方式が最もシンプルで運用しやすい。
 */
export async function fetchYouTubeTitle(youtubeUrl: string): Promise<string> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`;
    const res = await fetch(oembedUrl);
    if (!res.ok) return "";
    const data = await res.json() as { title?: string };
    return data.title ?? "";
  } catch {
    return "";
  }
}
