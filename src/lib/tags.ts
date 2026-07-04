/**
 * タグの選択肢をここで一元管理する。
 *
 * microCMS の設定画面での選択肢もこのファイルの値に合わせること。
 * フィルターUIとmicroCMSのスキーマで二重管理にならないよう、単一ソースとして使う。
 */

export const TAG_TYPE = ["アニメ", "実写", "3DCG", "モーショングラフィックス"] as const;
export const TAG_STYLE = ["ポップ", "クール", "かわいい", "サブカル", "スタイリッシュ", "和風"] as const;
export const TAG_GENRE = ["ポップス", "アイドル", "ロック", "電子音楽", "ラップ"] as const;

export const TAG_CATEGORIES = [
  { key: "type" as const, label: "タイプ", options: TAG_TYPE },
  { key: "style" as const, label: "スタイル", options: TAG_STYLE },
  { key: "genre" as const, label: "ジャンル", options: TAG_GENRE },
] as const;

export type TagCategoryKey = "type" | "style" | "genre";
