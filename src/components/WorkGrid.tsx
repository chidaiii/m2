import type { Work } from "@/types/work";
import WorkCard from "./WorkCard";
import styles from "./WorkGrid.module.css";

interface Props {
  works: Work[];
  onSelect: (work: Work) => void;
}

export default function WorkGrid({ works, onSelect }: Props) {
  return (
    <div className={styles.grid}>
      {works.map((work) => (
        <WorkCard key={work.id} work={work} onClick={() => onSelect(work)} />
      ))}
    </div>
  );
}
