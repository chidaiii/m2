import { getWorks } from "@/lib/microcms";
import WorkGrid from "@/components/WorkGrid";
import styles from "./page.module.css";

// ISR: 1時間ごとにキャッシュを更新する
export const revalidate = 3600;

export default async function Home() {
  const works = await getWorks();

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.siteTitle}>motion×music col.</h1>
        <p className={styles.siteDescription}>
          モーショングラフィックス × 音楽の作品ギャラリー
        </p>
      </header>
      <WorkGrid works={works} />
    </main>
  );
}
