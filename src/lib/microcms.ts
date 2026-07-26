import { createClient } from "microcms-js-sdk";
import type { Work } from "@/types/work";
import { extractVideoId, fetchYouTubeTitle, fetchYouTubePublishDates } from "./youtube";

const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = process.env.MICROCMS_API_KEY;

export async function getWorks(): Promise<Work[]> {
  if (!serviceDomain || !apiKey) {
    return [];
  }

  const client = createClient({ serviceDomain, apiKey });

  // offsetベースのページネーションで全件取得する（100件を超えても取りこぼさない）
  const allContents: Work[] = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const data = await client.getList<Work>({
      endpoint: "works",
      queries: { limit, offset },
    });
    allContents.push(...data.contents);
    if (offset + limit >= data.totalCount) break;
    offset += limit;
  }

  // タイトル補完（microCMSのtitleが空の場合はoEmbedで取得）
  let works = await Promise.all(
    allContents.map(async (work) => {
      if (!work.title) {
        const title = await fetchYouTubeTitle(work.youtubeUrl);
        return { ...work, title };
      }
      return work;
    })
  );

  // YouTube投稿日を取得してソート（新しい順）
  // YOUTUBE_API_KEYが未設定の場合はmicroCMS登録順のまま
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  if (youtubeApiKey) {
    const videoIds = works
      .map((w) => extractVideoId(w.youtubeUrl))
      .filter((id): id is string => id !== null);

    const dateMap = await fetchYouTubePublishDates(videoIds, youtubeApiKey);

    works = works.map((work) => {
      const videoId = extractVideoId(work.youtubeUrl);
      const youtubePublishedAt = videoId ? dateMap.get(videoId) : undefined;
      return { ...work, youtubePublishedAt };
    });

    works.sort((a, b) => {
      const dateA = new Date(a.youtubePublishedAt ?? a.publishedAt).getTime();
      const dateB = new Date(b.youtubePublishedAt ?? b.publishedAt).getTime();
      return dateB - dateA;
    });
  }

  return works;
}
