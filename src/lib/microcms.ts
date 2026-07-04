import { createClient } from "microcms-js-sdk";
import type { Work } from "@/types/work";
import { fetchYouTubeTitle } from "./youtube";

if (!process.env.MICROCMS_SERVICE_DOMAIN) {
  throw new Error("環境変数 MICROCMS_SERVICE_DOMAIN が設定されていません。.env.local を確認してください。");
}
if (!process.env.MICROCMS_API_KEY) {
  throw new Error("環境変数 MICROCMS_API_KEY が設定されていません。.env.local を確認してください。");
}

const client = createClient({
  serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN,
  apiKey: process.env.MICROCMS_API_KEY,
});

/**
 * 作品一覧を新着順で取得する。
 *
 * titleが空欄の作品はoEmbed APIでタイトルを補完する。
 * この処理はビルド時（またはISR再生成時）に一度だけ実行される。
 * ISR設定: revalidate: 3600（1時間ごとにキャッシュを更新）
 */
export async function getWorks(): Promise<Work[]> {
  const data = await client.getList<Work>({
    endpoint: "works",
    queries: {
      orders: "-publishedAt",
      limit: 100,
    },
  });

  // titleが空の作品はoEmbedで補完（ビルド時に解決する）
  const works = await Promise.all(
    data.contents.map(async (work) => {
      if (!work.title) {
        const title = await fetchYouTubeTitle(work.youtubeUrl);
        return { ...work, title };
      }
      return work;
    })
  );

  return works;
}
