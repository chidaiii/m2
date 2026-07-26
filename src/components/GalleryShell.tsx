"use client";

import { useMemo, useState } from "react";
import type { Work } from "@/types/work";
import type { TagCategoryKey } from "@/lib/tags";
import Sidebar from "./Sidebar";
import WorkGrid from "./WorkGrid";
import Pagination from "./Pagination";
import VideoModal from "./VideoModal";
import styles from "./GalleryShell.module.css";

interface Props {
  works: Work[];
}

export type SelectedTags = Record<TagCategoryKey, string[]>;

const INITIAL_TAGS: SelectedTags = { type: [], style: [], genre: [] };
const PAGE_SIZE = 24;

export default function GalleryShell({ works }: Props) {
  const [selectedTags, setSelectedTags] = useState<SelectedTags>(INITIAL_TAGS);
  const [activeWork, setActiveWork] = useState<Work | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const toggleTag = (category: TagCategoryKey, tag: string) => {
    setSelectedTags((prev) => {
      const current = prev[category];
      const next = current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag];
      return { ...prev, [category]: next };
    });
    setCurrentPage(1);
  };

  const hasFilter =
    selectedTags.type.length > 0 ||
    selectedTags.style.length > 0 ||
    selectedTags.genre.length > 0;

  /**
   * フィルターロジック：
   * - 同一カテゴリ内は OR（いずれかに一致）
   * - カテゴリをまたぐと AND（すべてのカテゴリ条件を満たす）
   * - 例: type=["3DCG"] + style=["クール","ポップ"]
   *   → 3DCGかつ（クールまたはポップ）に一致する作品
   */
  const filteredWorks = useMemo(() => {
    if (!hasFilter) return works;
    return works.filter((work) => {
      const typeMatch =
        selectedTags.type.length === 0 ||
        selectedTags.type.some((t) => work.type?.includes(t as never));
      const styleMatch =
        selectedTags.style.length === 0 ||
        selectedTags.style.some((t) => work.style?.includes(t as never));
      const genreMatch =
        selectedTags.genre.length === 0 ||
        selectedTags.genre.some((t) => work.genre?.includes(t as never));
      return typeMatch && styleMatch && genreMatch;
    });
  }, [works, selectedTags, hasFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredWorks.length / PAGE_SIZE));
  const pagedWorks = filteredWorks.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const countLabel = `${filteredWorks.length} of ${works.length} movies`;

  return (
    <div className={styles.shell}>
      <Sidebar selectedTags={selectedTags} onToggle={toggleTag} />
      <main className={styles.main}>
        <p className={styles.count}>{countLabel}</p>
        {filteredWorks.length === 0 ? (
          <p className={styles.empty}>該当する作品がありません</p>
        ) : (
          <>
            <WorkGrid works={pagedWorks} onSelect={setActiveWork} />
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
                label={countLabel}
              />
            )}
          </>
        )}
      </main>
      {activeWork && (
        <VideoModal work={activeWork} onClose={() => setActiveWork(null)} />
      )}
    </div>
  );
}
