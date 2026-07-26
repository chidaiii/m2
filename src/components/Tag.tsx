import styles from "./Tag.module.css";

interface Props {
  label: string;
  isActive: boolean;
  onClick: () => void;
  /**
   * "on-dark": 黒背景上（サイドバー）— 選択時はアクセントカラー背景
   * "on-accent": アクセントカラー背景上（投稿モーダル）— 選択時は白背景+アクセントカラー文字
   */
  variant?: "on-dark" | "on-accent";
}

export default function Tag({
  label,
  isActive,
  onClick,
  variant = "on-dark",
}: Props) {
  const variantClass = variant === "on-accent" ? styles.onAccent : styles.onDark;
  return (
    <button
      className={`${styles.tag} ${variantClass}${isActive ? ` ${styles.active}` : ""}`}
      onClick={onClick}
      aria-pressed={isActive}
      type="button"
    >
      {label}
    </button>
  );
}
