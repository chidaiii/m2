import Image from "next/image";
import styles from "./Pagination.module.css";

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  label: string;
}

type PageItem = number | "…";

/** 現在ページ周辺 + 先頭/末尾のみを残し、間を省略記号でつなぐ */
function getPageItems(current: number, total: number): PageItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const keep = new Set<number>([1, 2, 3, total, current]);
  if (current > 1) keep.add(current - 1);
  if (current < total) keep.add(current + 1);

  const sorted = Array.from(keep)
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);

  const items: PageItem[] = [];
  let prev = 0;
  for (const n of sorted) {
    if (prev && n - prev > 1) items.push("…");
    items.push(n);
    prev = n;
  }
  return items;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  label,
}: Props) {
  const items = getPageItems(currentPage, totalPages);

  return (
    <div className={styles.pagination}>
      <p className={styles.label}>{label}</p>
      <div className={styles.controls}>
        <button
          className={styles.arrowBtn}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="前のページ"
          type="button"
        >
          <Image
            src="/icon-arrow.svg"
            alt=""
            width={7}
            height={13}
            className={styles.arrowPrev}
          />
        </button>
        {items.map((item, i) =>
          item === "…" ? (
            <span key={`ellipsis-${i}`} className={styles.ellipsis}>
              …
            </span>
          ) : (
            <button
              key={item}
              className={`${styles.pageBtn}${item === currentPage ? ` ${styles.pageBtnActive}` : ""}`}
              onClick={() => onPageChange(item)}
              aria-label={`${item}ページ`}
              aria-current={item === currentPage ? "page" : undefined}
              type="button"
            >
              {item}
            </button>
          )
        )}
        <button
          className={styles.arrowBtn}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="次のページ"
          type="button"
        >
          <Image
            src="/icon-arrow.svg"
            alt=""
            width={7}
            height={13}
            className={styles.arrowNext}
          />
        </button>
      </div>
    </div>
  );
}
