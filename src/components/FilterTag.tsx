import styles from "./FilterTag.module.css";

interface Props {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export default function FilterTag({ label, isActive, onClick }: Props) {
  return (
    <button
      className={`${styles.tag}${isActive ? ` ${styles.active}` : ""}`}
      onClick={onClick}
      aria-pressed={isActive}
      type="button"
    >
      {label}
    </button>
  );
}
