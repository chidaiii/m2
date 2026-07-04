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
