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

export default function WorkGrid({ works }: Props) {
  const [selectedTags, setSelectedTags] = useState<SelectedTags>(INITIAL_TAGS);
  const [activeWork, setActiveWork] = useState<Work | null>(null);

  const toggleTag = (category: TagCategoryKey, tag: string) => {
    setSelectedTags((prev) => {
      const current = prev[category];
      const next = current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag];
      return { ...prev, [category]: next };
    });
  };

  const clearAll = () => setSelectedTags(INITIAL_TAGS);

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
        <div className={styles.grid}>
          {filteredWorks.map((work) => (
            <WorkCard
              key={work.id}
              work={work}
              onClick={() => setActiveWork(work)}
            />
          ))}
        </div>
      )}
      {activeWork && (
        <VideoModal work={activeWork} onClose={() => setActiveWork(null)} />
      )}
    </section>
  );
}
