import Image from "next/image";
import { TAG_CATEGORIES } from "@/lib/tags";
import type { TagCategoryKey } from "@/lib/tags";
import type { SelectedTags } from "./GalleryShell";
import Tag from "./Tag";
import styles from "./Sidebar.module.css";

interface Props {
  selectedTags: SelectedTags;
  onToggle: (category: TagCategoryKey, tag: string) => void;
}

export default function Sidebar({ selectedTags, onToggle }: Props) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoBlock}>
        <Image src="/logo.svg" alt="m2archive" width={168} height={24} />
        <p className={styles.tagline}>CGを用いた質の高いMVの収集・記録</p>
      </div>

      <div className={styles.filters}>
        {TAG_CATEGORIES.map(({ key, label, options }) => (
          <div key={key} className={styles.category}>
            <div className={styles.categoryLabel}>
              <span>{label}</span>
              <span className={styles.categoryCount}>{options.length}</span>
            </div>
            <div className={styles.rule} aria-hidden="true" />
            <div className={styles.tags}>
              {options.map((tag) => (
                <Tag
                  key={tag}
                  label={tag}
                  isActive={selectedTags[key].includes(tag)}
                  onClick={() => onToggle(key, tag)}
                  variant="on-dark"
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className={styles.copyright}>©2026 m2 archive.</p>
    </aside>
  );
}
