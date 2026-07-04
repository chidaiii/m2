import { TAG_CATEGORIES } from "@/lib/tags";
import type { TagCategoryKey } from "@/lib/tags";
import type { SelectedTags } from "./WorkGrid";
import FilterTag from "./FilterTag";
import styles from "./TagFilter.module.css";

interface Props {
  selectedTags: SelectedTags;
  onToggle: (category: TagCategoryKey, tag: string) => void;
  onClearAll: () => void;
  hasFilter: boolean;
}

export default function TagFilter({
  selectedTags,
  onToggle,
  onClearAll,
  hasFilter,
}: Props) {
  return (
    <div className={styles.wrapper}>
      {TAG_CATEGORIES.map(({ key, label, options }) => (
        <div key={key} className={styles.category}>
          <span className={styles.categoryLabel}>{label}</span>
          <div className={styles.tags}>
            {options.map((tag) => (
              <FilterTag
                key={tag}
                label={tag}
                isActive={selectedTags[key].includes(tag)}
                onClick={() => onToggle(key, tag)}
              />
            ))}
          </div>
        </div>
      ))}
      {hasFilter && (
        <div className={styles.footer}>
          <button
            className={styles.clearButton}
            onClick={onClearAll}
            type="button"
          >
            クリア
          </button>
        </div>
      )}
    </div>
  );
}
