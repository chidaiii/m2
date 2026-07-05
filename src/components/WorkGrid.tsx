"use client";

import { useState, useMemo } from "react";
import type { Work } from "@/types/work";
import type { TagCategoryKey } from "@/lib/tags";
import WorkCard from "./WorkCard";
import TagFilter from "./TagFilter";
import VideoModal from "./VideoModal";
import styles from "./WorkGrid.module.css";

interface Props {
  works: Work[];
}

export type SelectedTags = Record<TagCategoryKey, string[]>;

const INITIAL_TAGS: SelectedTags = { type: [], style: [], genre: [] };
const PAGE_SIZE = 24;

export default function WorkGrid({ works }: Props) {
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

  const clearAll = () => {
    setSelectedTags(INITIAL_TAGS);
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

  const totalPages = Math.ceil(filteredWorks.length / PAGE_SIZE);
  const pagedWorks = filteredWorks.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section>
      <TagFilter
        selectedTags={selectedTags}
        onToggle={toggleTag}
        onClearAll={clearAll}
        hasFilter={hasFilter}
      />
      {filteredWorks.length === 0 ? (
        <p className={styles.empty}>該当する作品がありません</p>
      ) : (
        <>
          <div className={styles.grid}>
            {pagedWorks.map((work) => (
              <WorkCard
                key={work.id}
                work={work}
                onClick={() => setActiveWork(work)}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="前のページ"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`${styles.pageBtn} ${page === currentPage ? styles.pageBtnActive : ""}`}
                  onClick={() => goToPage(page)}
                  aria-label={`${page}ページ`}
                  aria-current={page === currentPage ? "page" : undefined}
                >
                  {page}
                </button>
              ))}
              <button
                className={styles.pageBtn}
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="次のページ"
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
      {activeWork && (
        <VideoModal work={activeWork} onClose={() => setActiveWork(null)} />
      )}
    </section>
  );
}
