import Image from "next/image";
import styles from "./Pagination.module.css";

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  label: string;
}

type PageItem = number | "…";

function getPageItems(current: number, total: number): PageItem[] {
  if (total <= 1) return [1];

  const keep = new Set<number>([1, total]);

  if (current === 1) {
    keep.add(2);
    if (total >= 3) keep.add(3);
  } else if (current === total) {
    keep.add(total - 1);
    if (total >= 3) keep.add(total - 2);
  } else {
    keep.add(current - 1);
    keep.add(current);
    keep.add(current + 1);
  }

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

function ArrowButton({
  onClick,
  disabled,
  direction,
  ariaLabel,
}: {
  onClick: () => void;
  disabled: boolean;
  direction: "prev" | "next";
  ariaLabel: string;
}) {
  return (
    <button
      className={`${styles.arrowBtn} ${direction === "prev" ? styles.arrowBtnPrev : styles.arrowBtnNext}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      type="button"
    >
      <span className={direction === "prev" ? styles.arrowWrapPrev : styles.arrowWrapNext}>
        <Image src="/icon-arrow.svg" alt="" width={8} height={16} />
      </span>
    </button>
  );
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
        <ArrowButton
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          direction="prev"
          ariaLabel="前のページ"
        />
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
        <ArrowButton
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          direction="next"
          ariaLabel="次のページ"
        />
      </div>
    </div>
  );
}
