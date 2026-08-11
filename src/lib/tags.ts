/**
 * タグの選択肢をここで一元管理する。
 *
 * microCMS の設定画面での選択肢もこのファイルの値に合わせること。
 * フィルターUIとmicroCMSのスキーマで二重管理にならないよう、単一ソースとして使う。
 */

export const TAG_TYPE = [
  "モーショングラフィックス",
  "3DCG",
  "VFX",
  "実写",
  "アニメーション",
  "イラスト",
  "タイポグラフィ",
  "ストップモーション",
  "ロトスコープ",
] as const;
export const TAG_STYLE = [
  "シンプル",
  "ポップ",
  "かわいい",
  "スタイリッシュ",
  "クール",
  "ダーク",
  "エモーショナル",
  "サイバー",
  "和風",
  "漫画風",
  "ゲーム感",
  "ストーリー性",
  "高いカメラ技術",
  "ウェブコア",
] as const;
export const TAG_GENRE = [
  "ポップス",
  "ボカロ",
  "エレクトロニカ",
  "ロック",
  "アニメ",
  "ヒップホップ",
] as const;

export const TAG_CATEGORIES = [
  { key: "type" as const, label: "TYPE", options: TAG_TYPE },
  { key: "style" as const, label: "style", options: TAG_STYLE },
  { key: "genre" as const, label: "MUSIC", options: TAG_GENRE },
] as const;

export type TagCategoryKey = "type" | "style" | "genre";
