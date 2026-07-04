// microCMS から取得する作品データの型定義

export type TagType = "アニメ" | "実写" | "3DCG" | "モーショングラフィックス";
export type TagStyle = "ポップ" | "クール" | "かわいい" | "サブカル" | "スタイリッシュ" | "和風";
export type TagGenre = "ポップス" | "アイドル" | "ロック" | "電子音楽" | "ラップ";

export interface Work {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
  youtubeUrl: string;
  // titleが空欄の場合はビルド時にoEmbedで補完される（lib/microcms.ts参照）
  title: string;
  type: TagType[];
  style: TagStyle[];
  genre: TagGenre[];
}
