/**
 * タグの選択肢をここで一元管理する。
 *
 * microCMS の設定画面での選択肢もこのファイルの値に合わせること。
 * フィルターUIとmicroCMSのスキーマで二重管理にならないよう、単一ソースとして使う。
 */

export const TAG_TYPE = [
  "モーショングラフィックス",
  "3DCG",
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
  "漫画風",
  "ゲーム感",
  "ストーリー性",
  "高いカメラ技術",
  "ウェブコア",
  "ユニーク",
] as const;
export const TAG_MUSIC = [
  "ポップス",
  "ボカロ",
  "エレクトロニカ",
  "ロック",
  "アニソン",
  "ヒップホップ",
] as const;

export const TAG_CATEGORIES = [
  { key: "type" as const, label: "TYPE", options: TAG_TYPE },
  { key: "style" as const, label: "style", options: TAG_STYLE },
  { key: "music" as const, label: "MUSIC", options: TAG_MUSIC },
] as const;

export type TagCategoryKey = "type" | "style" | "music";

/**
 * microCMS側の実際の値(保存されているタグ文字列)を変えずに、
 * 画面上の表示ラベルだけ変えたい場合はここに追加する。
 * key: microCMSに保存されている実際の値 / value: 画面に表示するラベル
 */
const TAG_LABEL_OVERRIDES: Record<string, string> = {
  漫画風: "コミック調",
  エレクトロニカ: "エレクトロニック",
};

export function getTagLabel(tag: string): string {
  return TAG_LABEL_OVERRIDES[tag] ?? tag;
}
