/**
 * SP専用のロゴ+タグラインヘッダー。
 *
 * PC版はSidebar内のロゴ・タグラインを使うため、これはSPでのみ表示する(CSSで制御)。
 * 全ページ共通のレイアウト(layout.tsx)に置くことで、ページ遷移しても
 * 常にサイト最上部・左寄せで表示される。position: fixed は使わない
 * (ページの通常のスクロールに追従する)。
 */

import Image from "next/image";
import { TAGLINE_PHRASES } from "@/lib/tagline";
import TypewriterTagline from "./TypewriterTagline";
import styles from "./MobileBrandHeader.module.css";

export default function MobileBrandHeader() {
  return (
    <div className={styles.header}>
      <Image src="/logo.svg" alt="m2 index" width={155} height={26} />
      <TypewriterTagline phrases={TAGLINE_PHRASES} className={styles.tagline} />
    </div>
  );
}
