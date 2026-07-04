import { createClient } from "microcms-js-sdk";
import type { Work } from "@/types/work";
import { fetchYouTubeTitle } from "./youtube";

const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = process.env.MICROCMS_API_KEY;

export async function getWorks(): Promise<Work[]> {
  if (!serviceDomain || !apiKey) {
    return [];
  }

  const client = createClient({ serviceDomain, apiKey });

  const data = await client.getList<Work>({
    endpoint: "works",
    queries: {
      orders: "-publishedAt",
      limit: 100,
    },
  });

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
