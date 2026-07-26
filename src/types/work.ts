// microCMS から取得する作品データの型定義

export type TagType =
  | "モーショングラフィックス"
  | "3DCG"
  | "VFX"
  | "実写"
  | "アニメーション"
  | "イラスト"
  | "タイポグラフィ"
  | "ストップモーション"
  | "ロトスコープ";
export type TagStyle =
  | "シンプル"
  | "ポップ"
  | "かわいい"
  | "スタイリッシュ"
  | "クール"
  | "ダーク"
  | "エモーショナル"
  | "サイバー"
  | "和風"
  | "漫画風"
  | "ゲーム感";
export type TagGenre =
  | "ポップス"
  | "ボカロ"
  | "エレクトロニカ"
  | "ロック"
  | "アニメ"
  | "ヒップホップ";

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
  // ビルド時にYouTube Data APIから取得したYouTube投稿日（ソート用）
  youtubePublishedAt?: string;
}
