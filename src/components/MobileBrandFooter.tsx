/**
 * SP専用のコピーライト表示。
 *
 * ハンバーガーメニュー内に残さず、サイトの一番下(左寄せ)に配置する。
 * 全ページ共通のレイアウト(layout.tsx)に置くことで、ページ遷移しても
 * 常にサイト最下部に表示される。position: fixed は使わない。
 */

import styles from "./MobileBrandFooter.module.css";

export default function MobileBrandFooter() {
  return <p className={styles.copyright}>©2026 m2 index.</p>;
}
